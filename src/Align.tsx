/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

//风险: 改完之后有些功能不能用，是跟类型相关!!!
import * as React from 'react'
import { useRef, useEffect, useState, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './style.less'
import './restCss.less'
import { produce } from 'immer'
import purify from "dompurify"
import {
  ModalOptions,
  AlignProps,
  RecordsType,
  LocalValEntryType,
  LocalReturnType,
  SplitCbImParams,
  GeneralFnInterface,
  UpdateCbImParams,
  ReplaceInterface,
  SplitInterface,
  DataListType,
  UiListType,
  SourceListType,
  TargetListType,
  UpdateImParams,
  TdToPType,
  UpdateDataBarType,
  GetSelectedNodesType
} from './align.interface'

const PrefixCls = 'align-tool'
const SOURCE = 'Source'
const TARGET = 'Target'
const CONT = 'cont'
const ALL = 'all'
const SELECTED = 'selected'

const debounce = <T extends (...args: any) => any>(fn: T, wait: number = 100, options?: object) => {
  let timer: any
  const context: any = this
  return function () {
    const _args = arguments
    if (options && !timer) {
      fn.apply(context, _args as any)
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(context, _args as any)
    }, wait)
  }
}


const Modal = memo((props: ModalOptions) => {
  const searchRef = useRef<string | null>(null)
  const replaceRef = useRef<string | null>(null)
  const {
    visible = false,
    onClose,
    searchKeyWord,
    replaceAllKeyWord
  } = props

  return visible
    ? <div>
      {
        createPortal(
          <div className='aligin-modal' >
            <div>
              <input type="text" onChange={e => searchRef.current = e.target.value} placeholder='查询' />
              <input type="text" onChange={e => replaceRef.current = e.target.value} placeholder='替换' />
            </div>
            <span onClick={() => searchKeyWord(searchRef.current)}> 查询 </span>
            <span onClick={() => replaceAllKeyWord(searchRef.current, replaceRef.current)}> 全替换 </span>
            <span onClick={onClose} > 关 </span>
          </div>
          , document.querySelector('body') as Element)
      }
    </div>
    : null
})

const Align: React.FC<AlignProps> = ({
  dataList = [],
  exportData
}) => {
  const [visible, setVisible] = useState(false)
  const [sourceList, setSourceList] = useState<SourceListType>([])
  const [targetList, setTargetList] = useState<TargetListType>([])
  const isSplit = useRef(false)
  const maxListLength = Math.max(sourceList.length, targetList.length)
  const setLocal = (key: keyof LocalReturnType, val: LocalValEntryType) => localStorage.setItem(key, JSON.stringify(val))
  const removeLocal = (key: string) => localStorage.removeItem(key)
  const getLocal = <T extends keyof LocalReturnType>(key: T): LocalReturnType[T] => localStorage.getItem(key) && JSON.parse(localStorage.getItem(key) as any)

  const setCache = (params: RecordsType) => {
    const step = getLocal('recordStep') + 1
    const record = { ...params, step }
    let _records = getLocal('records') || []
    _records = _records.filter(v => !(v.step === step))
    _records.push(record)
    setLocal('records', _records)
    setLocal('recordStep', step)
  }

  const onCloseModal = () => {
    const getKeywordList = (dataList: string[]) => produce(dataList, draft =>
      draft.map(v =>
        v.replace(new RegExp('<span class="yellow">', 'g'), '')
          .replace(new RegExp('</span>', 'g'), ''))
    )
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
    setVisible(false)
  }


  const searchKeyWord = (val: string | null) => {
    if (!val) return

    const getKeywordList = (dataList: string[]) => produce(dataList, draft =>
      draft.map(v =>
        v.replace(new RegExp('<span class="yellow">', 'g'), '')
          .replace(new RegExp('</span>', 'g'), '')
          .replace(new RegExp(val, 'g'), `<span class="yellow">${val}</span>`))
    )
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
  }

  const replaceCb = (searchVal: ReplaceInterface['searchVal'] | void, replaceVal: ReplaceInterface['replaceVal'] | void) => {
    if (!searchVal || !replaceVal) return
    const getKeywordList = (dataList: string[]) => produce(dataList, draft => draft.map(v => v.replace(new RegExp(searchVal, 'g'), replaceVal)))
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
  }

  const replaceAllKeyWord = (searchVal: ReplaceInterface['searchVal'] | null, replaceVal: ReplaceInterface['replaceVal'] | null) => {
    if (!searchVal || !replaceVal) return
    setCache({
      type: 'replace',
      searchVal,
      replaceVal
    })
    replaceCb(`<span class="yellow">${searchVal}</span>`, replaceVal)
  }

  const getBarAndId: (node: HTMLElement) => [string, number] = node => {
    const [dataBar, id] = (node.getAttribute('data-bar') || '').split('-')
    return [dataBar, Number(id)]
  }

  const hasALL = (dataBar: string) => dataBar === ALL

  const getSelectedNodes = (): GetSelectedNodesType | void => {
    //这里还有什么更好的方法吗,集合怎么处理
    const nodes = [...document.querySelectorAll(`.${SELECTED}`) as any]
    if (!nodes.length) return
    let isALL
    const dataBar = getBarAndId(nodes[0].childNodes[0])[0]
    const ids = nodes.map(v => {
      const [_dataBar, id] = getBarAndId(v.childNodes[0])
      hasALL(_dataBar) && (isALL = true)
      return id
    }).sort()

    return {
      dataBar: isALL ? ALL : dataBar,
      startId: ids[0],
      endId: ids[ids.length - 1]
    }
  }

  const executeDataBarBranchFn = (dataBar: string, allFn: Function, sourcefn: Function, targetFn: Function) => {
    if (hasALL(dataBar)) {
      allFn()
    } else if (dataBar === SOURCE) {
      sourcefn()
    } else {
      targetFn()
    }
  }

  //由于是js改ts,后续这种直接改interface,下面暂时省略了
  const splitCb = (dataBar: SplitInterface['dataBar'], startId: SplitInterface['startId'], sourcePositions: SplitInterface['sourcePositions'] | void, targetPositions: SplitInterface['targetPositions'] | void) => {
    if (!sourcePositions || !targetPositions) return
    const params: SplitCbImParams = {}
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      params.sourcePositions = sourcePositions
      const _deleteds: string[] = []
      let deletedItemArr = draft[startId].split('')
      sourcePositions.forEach(v => {
        const item = deletedItemArr.splice(0, v).join('')
        _deleteds.push(item)
      })
      draft.splice(startId, 1, ..._deleteds)
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      params.targetPositions = targetPositions
      const _deleteds: string[] = []
      let deletedItemArr = draft[startId].split('')
      targetPositions.forEach(v => {
        const item = deletedItemArr.splice(0, v).join('')
        _deleteds.push(item)
      })
      draft.splice(startId, 1, ..._deleteds)
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
    return params
  }

  const splitRow = () => {
    const focusNode: HTMLElement | null = document.querySelector('div[contentEditable=true]')
    if (!focusNode) return

    const [dataBar, id] = getBarAndId(focusNode as HTMLElement)
    const maxLength = focusNode.innerText.length
    if (hasALL(dataBar)) return
    isSplit.current = true

    const _getSelection = window.getSelection()
    if (!_getSelection) return
    const range = _getSelection.getRangeAt(0)
    const preCaretRange = range && range.cloneRange()
    preCaretRange.selectNodeContents(focusNode)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    const cursorPosition = preCaretRange.toString().trim().length
    if ([maxLength, 0].includes(cursorPosition)) return

    const params = splitCb(dataBar, id, [cursorPosition, maxLength], [cursorPosition, maxLength])
    setCache({
      type: 'split',
      dataBar,
      startId: id,
      endId: id,
      ...params
    })
  }

  const mergeCb = (dataBar: string, startId: number, endId: number) => {
    const num = endId - startId + 1
    const sourcePositions: number[] = []
    const targetPositions: number[] = []

    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      const selecteds = draft.splice(startId, num)
      selecteds.forEach(v => sourcePositions.push(v.length))
      const selectedItem = selecteds.join('')
      draft.splice(startId, 0, selectedItem)
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      const selecteds = draft.splice(startId, num)
      selecteds.forEach(v => targetPositions.push(v.length))
      const selectedItem = selecteds.join('')
      draft.splice(startId, 0, selectedItem)
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
    return {
      sourcePositions,
      targetPositions
    }
  }

  const mergeRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId, endId } = selectedNodes
    if (!dataBar || !endId || !startId || endId <= startId) return
    const {
      sourcePositions,
      targetPositions
    } = mergeCb(dataBar, startId, endId)
    setCache({
      type: 'merge', dataBar, startId, endId, sourcePositions, targetPositions
    })
  }

  const exchangeCb = (startId: number, endId: number) => {
    const num = endId - startId + 1
    setSourceList(produce(sourceList, draft => {
      const targetReplace = targetList.slice(startId, endId + 1)
      draft.splice(startId, num, ...targetReplace)
    }))
    setTargetList(produce(targetList, draft => {
      const sourceReplace = sourceList.slice(startId, endId + 1)
      draft.splice(startId, num, ...sourceReplace)
    }))
  }

  const exchangeRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId, endId } = selectedNodes
    if (!dataBar || !hasALL(dataBar)) return
    setCache({
      type: 'exchange',
      dataBar,
      startId,
      endId
    })
    exchangeCb(startId, endId)
  }

  const moveUpCb = (dataBar: string, startId: number, endId: number) => {
    const getMoveUpfn = (dataList: string[]) => produce(dataList, draft => {
      const deletedItems = draft.splice(startId - 1, 1)
      draft.splice(endId, 0, ...deletedItems)
    })
    const sourcefn = () => setSourceList(prevState => getMoveUpfn(prevState))
    const targetFn = () => setTargetList(prevState => getMoveUpfn(prevState))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const moveUpRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId, endId } = selectedNodes
    if (!dataBar || startId <= 0) return
    setCache({
      type: 'moveUp',
      dataBar,
      startId,
      endId
    })
    moveUpCb(dataBar, startId, endId)
  }

  const moveDownCb = (dataBar: string, startId: number, endId: number) => {
    const getMoveDownfn = (dataList: string[]) => produce(dataList, draft => {
      const deletedItems = draft.splice(endId + 1, 1)
      draft.splice(startId, 0, ...deletedItems)
    })
    const sourcefn = () => setSourceList(prevState => getMoveDownfn(prevState))
    const targetFn = () => setTargetList(prevState => getMoveDownfn(prevState))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const moveDownRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId, endId } = selectedNodes
    if (!dataBar || endId >= maxListLength - 1) return
    setCache({
      type: 'moveDown',
      dataBar,
      startId,
      endId
    })
    moveDownCb(dataBar, startId, endId)
  }

  const updateCb = (dataBar: string, startId: number, endId: number, contSources: string[] = [], contTargets: string[] = []) => {
    const params: UpdateCbImParams = {}
    const num = endId - startId + 1
    const ids = Array.from({ length: num }, (v, i) => i + startId)
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      params.contSources = draft.slice(startId, endId + 1)
      ids.forEach((v, i) => draft[v] = (contSources[i] ? contSources[i] : ''))
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      params.contTargets = draft.slice(startId, endId + 1)
      ids.forEach((v, i) => draft[v] = (contTargets[i] ? contTargets[i] : ''))
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)

    return params
  }

  const deleteRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId, endId } = selectedNodes
    if (!dataBar) return
    setCache({
      type: 'delete',
      dataBar,
      startId,
      endId,
      ...updateCb(dataBar, startId, endId)
    })
  }

  const insertCb = (dataBar: string, startId: number, num: number, contSources: string[] = [], contTargets: string[] = []) => {
    const sourcefn = () => setSourceList(prevState => produce(prevState, draft => { draft.splice(startId, num, ...contSources) }))
    const targetFn = () => setTargetList(prevState => produce(prevState, draft => { draft.splice(startId, num, ...contTargets) }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const insertRow = () => {
    const selectedNodes = getSelectedNodes()
    if (!selectedNodes) return
    const { dataBar, startId } = selectedNodes
    if (!dataBar) return
    setCache({
      type: 'insert',
      dataBar,
      startId
    })
    insertCb(dataBar, startId, 0, [''], [''])
  }

  const backRecord = () => {
    const records = getLocal('records')
    const recordStep = Number(getLocal('recordStep'))
    if (!records || !recordStep) return
    const {
      type, dataBar, startId, endId, contSources, contTargets, searchVal, replaceVal, sourcePositions, targetPositions
    } = records.find(v => v.step === recordStep) as GeneralFnInterface

    switch (type) {
      case 'update':
        updateCb(dataBar, startId, endId, contSources, contTargets)
        break;
      case 'insert':
        insertCb(dataBar, startId, 1)
        break;
      case 'delete':
        updateCb(dataBar, startId, endId, contSources, contTargets)
        break;
      case 'moveDown':
        moveUpCb(dataBar, startId + 1, endId + 1)
        break;
      case 'moveUp':
        moveDownCb(dataBar, startId - 1, endId - 1)
        break;
      case 'exchange':
        exchangeCb(startId, endId)
        break;
      case 'merge':
        splitCb(dataBar, startId, sourcePositions, targetPositions)
        break;
      case 'split':
        mergeCb(dataBar, startId, endId + 1)
        break;
      case 'replace':
        replaceCb(replaceVal, searchVal)
        break;
    }
    setLocal('recordStep', getLocal('recordStep') - 1)
  }

  const forwardRecord = () => {
    const records = getLocal('records')
    if (!records) return
    //确认_record 百分百有step
    const _record = records[records.length - 1] as any
    if (_record && _record.step <= getLocal('recordStep')) return
    setLocal('recordStep', getLocal('recordStep') + 1)
    const recordStep = Number(getLocal('recordStep'))
    const {
      type, dataBar, startId, endId, searchVal, replaceVal, sourcePositions, targetPositions, afterContSources, afterContTargets
    } = records.find(v => v.step === recordStep) as GeneralFnInterface

    switch (type) {
      case 'update':
        updateCb(dataBar, startId, endId, afterContSources, afterContTargets)
        break;
      case 'insert':
        insertCb(dataBar, startId, 0, [''], [''])
        break;
      case 'delete':
        updateCb(dataBar, startId, endId)
        break;
      case 'moveDown':
        moveDownCb(dataBar, startId, endId)
        break;
      case 'moveUp':
        moveUpCb(dataBar, startId, endId)
        break;
      case 'exchange':
        exchangeCb(startId, endId)
        break;
      case 'merge':
        mergeCb(dataBar, startId, endId)
        break;
      case 'split':
        splitCb(dataBar, startId, sourcePositions, targetPositions)
        break;
      case 'replace':
        replaceCb(searchVal, replaceVal)
        break;
    }
  }

  const monitorKeyboard = debounce((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.ctrlKey || !sourceList.length || !targetList.length) return
    const actions = new Map<number, Function>([
      [77, mergeRow],
      [40, moveDownRow],
      [38, moveUpRow],
      [66, exchangeRow],
      [73, insertRow],
      [8, deleteRow],
      [13, splitRow],
      [70, () => setVisible(true)],
      [81, backRecord],
      [89, forwardRecord]
    ])
    const fn = actions.get(e.keyCode)
    fn && fn()
  }, 300)

  const _exportData = () => exportData && exportData(new Array(maxListLength).fill(1).map((v, i) => {
    return {
      "id": i + 1,
      "contSource": sourceList[i],
      "contTarget": targetList[i]
    }
  }) as any as DataListType[])

  const renderHeader = () => {

    const leftList = [
      {
        name: '回退',
        icon: '',
        title: 'Ctrl + Q',
        onClick: backRecord
      },
      {
        name: '前进',
        icon: '',
        title: 'Ctrl + Y',
        onClick: forwardRecord
      },
      {
        name: '合并',
        icon: '',
        title: 'Ctrl + M',
        onClick: mergeRow
      },
      {
        name: '拆分',
        icon: '',
        title: 'Ctrl + Enter',
        onClick: splitRow
      },
      {
        name: '上移',
        icon: '',
        title: 'Ctrl + ↑',
        onClick: moveUpRow
      },
      {
        name: '下移',
        icon: '',
        title: 'Ctrl + ↓',
        onClick: moveDownRow
      },
      {
        name: '调换',
        icon: '',
        title: 'Ctrl + B',
        onClick: exchangeRow
      },
      {
        name: '插入',
        icon: '',
        title: 'Ctrl + I',
        onClick: insertRow
      },
      {
        name: '删除',
        icon: '',
        title: 'Ctrl+Delete', //mac
        onClick: deleteRow
      },
      {
        name: '查找和替换',
        icon: '',
        onClick: () => setVisible(true)
      }
    ]
    const rightList = [
      {
        name: '导出',
        icon: '',
        onClick: _exportData
      },
    ]
    const renderLi = (list: UiListType[]) => list.map((v, i) => <li key={i} title={v.title} onClick={v.onClick} > {v.name} </li>)

    return <section className={`${PrefixCls}-header`}>
      <ul>
        {renderLi(leftList)}
      </ul>
      <ul>
        {renderLi(rightList)}
      </ul>
    </section>
  }

  const renderContent = useCallback(() => {
    const oldBarAndId = useRef<any[]>([])

    const changeIsContentEditable = (e: React.MouseEvent<HTMLElement>, boo: Boolean, boxShadow: string, event?: string) => {
      // node集合
      const _target = e.target as any
      _target.contentEditable = String(boo);
      _target.style.boxShadow = boxShadow;
      if (event) {
        clearAllNodeSelected()
        addNodesSelected(_target.parentNode as any as HTMLDivElement[]);
        _target[event]()
        const range = window.getSelection()
        if (!range) return
        range.selectAllChildren(_target)
        range.collapseToEnd()
      }
    }

    const updateData = (e: React.MouseEvent<HTMLSpanElement>, dataBar: UpdateDataBarType, id: number) => {
      if (isSplit.current) {
        isSplit.current = false
        return
      }
      changeIsContentEditable(e, false, 'none')
      const params: UpdateImParams = {}
      const _target = e.target as HTMLElement;
      params[`afterCont${dataBar}s`] = [_target.innerText]
      setCache({
        type: 'update',
        dataBar,
        startId: id,
        endId: id,
        ...updateCb(dataBar, id, id, [_target.innerText], [_target.innerText]),
        ...params
      })
    }

    const clearAllNodeSelected = () => document.querySelectorAll(`.${SELECTED}`).forEach(v => v.classList.remove(SELECTED))

    const addNodesSelected = (nodes: HTMLDivElement[]) => nodes && nodes.length && nodes.forEach(v => v.classList.add(SELECTED))

    const getSubscriptArr = (start: number, end: number) => new Array((Math.abs(end - start)) + 1).fill(Math.min(start, end)).map((v, i) => v + i)

    //There is no conflict without virtual dom
    const getClickNodes = (e: React.MouseEvent<HTMLElement>) => {
      // node集合
      const _target = e.target as any
      let nodes = [_target.parentNode]
      const [dataBar, id] = getBarAndId(_target)
      if (!dataBar) return
      const ifDataBarToEqualALL = hasALL(dataBar)
      const nodes_DATABAR_ALL = [..._target.parentNode.parentNode.childNodes]
      let oldId

      if (e.shiftKey) {
        if (oldBarAndId.current.length) {
          const [_dataBar, _id] = oldBarAndId.current
          oldId = _id
          if (_dataBar !== dataBar) {
            ifDataBarToEqualALL && (nodes = nodes_DATABAR_ALL)
          } else {
            const selectedIds = getSubscriptArr(_id, id)
            nodes = ifDataBarToEqualALL
              ? selectedIds.map(v => [...(document.querySelector(`span[data-bar=${dataBar}-${v}]`) as any).parentNode.parentNode.childNodes]).flat()
              : selectedIds.map(v => (document.querySelector(`div[data-bar=${dataBar}-${v}]`) || {}).parentNode)
          }
        } else {
          ifDataBarToEqualALL && (nodes = nodes_DATABAR_ALL)
        }
      } else {
        ifDataBarToEqualALL && (nodes = nodes_DATABAR_ALL)
      }

      const saveIdsLength = nodes.filter(v => getBarAndId(v.childNodes[0])[0] === (ifDataBarToEqualALL ? ALL : dataBar)).length
      clearAllNodeSelected()
      addNodesSelected(nodes)
      oldBarAndId.current = [dataBar, saveIdsLength === 1 ? id : oldId]
    }

    const TdToSpan = ({ id }: { id: number }) =>
      <td>
        <span className="number" data-bar={`${ALL}-${id}`}>
          {id + 1}
        </span>
      </td>


    const TdToP = (props: TdToPType) => {
      const { onDoubleClick, onBlur, text, direction, id } = props

      // const className = [
      //   !text && 'disabled'
      // ].filter(a => a).join(' ')

      return <td>
        <div suppressContentEditableWarning   //maybe input
          data-bar={`${direction}-${id}`}
          onDoubleClick={onDoubleClick}
          onBlur={debounce(onBlur)}
          dangerouslySetInnerHTML={{ __html: purify.sanitize(text) }
          }
        />
      </td>
    }

    return <section className={`${PrefixCls}-content-wrap`}>
      <div className={`${PrefixCls}-content`}>
        <table cellSpacing='0' cellPadding='0' >
          <tbody>
            {
              new Array(maxListLength).fill('').map((v, i) => <tr key={i} onClick={getClickNodes} >
                <TdToSpan
                  id={i}
                />
                <TdToP
                  onDoubleClick={e => changeIsContentEditable(e, true, 'inset 0 0 5px #1890ff', 'focus')}
                  onBlur={e => updateData(e, SOURCE, i)}
                  direction={SOURCE}
                  id={i}
                  text={sourceList[i]}
                />
                <TdToP
                  onDoubleClick={e => changeIsContentEditable(e, true, 'inset 0 0 5px #1890ff', 'focus')}
                  onBlur={e => updateData(e, TARGET, i)}
                  direction={TARGET}
                  id={i}
                  text={targetList[i]}
                />
              </tr>
              )
            }
          </tbody>
        </table>
      </div>
    </section>
  }, [sourceList, targetList])

  const getInit = () => {
    let _sourceList: SourceListType = []
    let _targetList: TargetListType = []
    dataList.forEach(v => {
      _sourceList.push(v[`${CONT + SOURCE}`])
      _targetList.push(v[`${CONT + TARGET}`])
    })
    if (window.confirm("是否打开上次保存数据?")) {
      _sourceList = getLocal('sourceList') || _sourceList
      _targetList = getLocal('targetList') || _targetList
    } else {
      removeLocal('sourceList')
      removeLocal('targetList')
      removeLocal('recordStep')
      removeLocal('records')
    }
    !getLocal('recordStep') && setLocal('recordStep', 0)
    setSourceList(_sourceList)
    setTargetList(_targetList)
  }

  useEffect(() => {
    getInit()
  }, [])

  useEffect(() => {
    document.body.addEventListener('keydown', monitorKeyboard)
    setLocal('sourceList', sourceList)
    setLocal('targetList', targetList)
    return () => {
      document.body.removeEventListener('keydown', monitorKeyboard)
    }
  }, [sourceList, targetList])

  return <div className={PrefixCls}>
    {renderHeader()}
    {renderContent()}
    <section className={`${PrefixCls}-footer`} >
      总行数：{maxListLength}
    </section>
    < Modal visible={visible}
      onClose={onCloseModal}
      searchKeyWord={searchKeyWord}
      replaceAllKeyWord={replaceAllKeyWord}
    />
  </div>
}

export default Align