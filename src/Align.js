/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

import React, { useRef, useEffect, useState, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './style.less'
import './restCss.less'
import { produce } from 'immer'
import PropTypes from 'prop-types'
import purify from "dompurify"

const PrefixCls = 'align-tool'
const SOURCE = 'Source'
const TARGET = 'Target'
const CONT = 'cont'
const ALL = 'all'
const SELECTED = 'selected'

const debounce = (fn, wait = 100, options) => {
  let timer
  return function () {
    if (options && !timer) {
      fn.apply(this, arguments)
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, arguments)
    }, wait)
  }
}


const Modal = memo((props) => {
  const searchRef = useRef('')
  const replaceRef = useRef('')
  const {
    visible = false,
    onClose,
    searchKeyWord,
    replaceAllKeyWord
  } = props

  return visible
    ? <div>
      {createPortal(
        <div className='aligin-modal'>
          <div>
            <input type="text" onChange={e => searchRef.current = e.target.value} placeholder='查询' />
            <input type="text" onChange={e => replaceRef.current = e.target.value} placeholder='替换' />
          </div>
          <span onClick={() => searchKeyWord(searchRef.current)}>查询</span>
          <span onClick={() => replaceAllKeyWord(searchRef.current, replaceRef.current)}>全替换</span>
          <span onClick={onClose}>关</span>
        </div>
        , document.querySelector('body'))}
    </div>
    : null
})

const Align = ({ dataList, exportData }) => {
  const [visible, setVisible] = useState(false)
  const [sourceList, setSourceList] = useState([])
  const [targetList, setTargetList] = useState([])
  const isSplit = useRef(false)
  const maxListLength = Math.max(sourceList.length, targetList.length)
  const setLocal = (key, val) => localStorage.setItem(key, JSON.stringify(val))
  const removeLocal = key => localStorage.removeItem(key)
  const getLocal = key => localStorage.getItem(key) && JSON.parse(localStorage.getItem(key))

  const setCache = params => {
    const step = getLocal('recordStep') + 1
    const record = { ...params, step }
    let _records = getLocal('records') || []
    _records = _records.filter(v => !(v.step === step))
    _records.push(record)
    setLocal('records', _records)
    setLocal('recordStep', step)
  }

  const onCloseModal = () => {
    const getKeywordList = dataList => produce(dataList, draft =>
      draft.map(v =>
        v.replace(new RegExp('<span class="yellow">', 'g'), '')
          .replace(new RegExp('</span>', 'g'), ''))
    )
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
    setVisible(false)
  }


  const searchKeyWord = val => {
    if (!val) return void (0)

    const getKeywordList = dataList => produce(dataList, draft =>
      draft.map(v =>
        v.replace(new RegExp('<span class="yellow">', 'g'), '')
          .replace(new RegExp('</span>', 'g'), '')
          .replace(new RegExp(val, 'g'), `<span class="yellow">${val}</span>`))
    )
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
  }

  const replaceCb = (searchVal, replaceVal) => {
    const getKeywordList = (dataList) => produce(dataList, draft => draft.map(v => v.replace(new RegExp(searchVal, 'g'), replaceVal)))
    setSourceList(getKeywordList(sourceList))
    setTargetList(getKeywordList(targetList))
  }

  const replaceAllKeyWord = (searchVal, replaceVal) => {
    if (!searchVal || !replaceVal) return void (0)
    setCache({
      type: 'replace',
      searchVal,
      replaceVal
    })
    replaceCb(`<span class="yellow">${searchVal}</span>`, replaceVal)
  }

  const getBarAndId = node => {
    const [dataBar, id] = (node.getAttribute('data-bar') || '').split('-')
    return [dataBar, Number(id)]
  }

  const hasALL = dataBar => dataBar === ALL

  const getSelectedNodes = () => {
    const nodes = [...document.querySelectorAll(`.${SELECTED}`)]
    if (!nodes.length) return {}
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

  const executeDataBarBranchFn = (dataBar, allFn, sourcefn, targetFn) => {
    if (hasALL(dataBar)) {
      allFn()
    } else if (dataBar === SOURCE) {
      sourcefn()
    } else {
      targetFn()
    }
  }

  const splitCb = (dataBar, startId, sourcePositions, targetPositions) => {
    const params = {}
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      params.sourcePositions = sourcePositions
      const _deleteds = []
      let deletedItemArr = draft[startId].split('')
      sourcePositions.forEach(v => {
        const item = deletedItemArr.splice(0, v).join('')
        _deleteds.push(item)
      })
      draft.splice(startId, 1, ..._deleteds)
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      params.targetPositions = targetPositions
      const _deleteds = []
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
    const focusNode = document.querySelector('div[contentEditable=true]')
    if (!focusNode) return void (0)

    const [dataBar, id] = getBarAndId(focusNode)
    const maxLength = focusNode.innerText.length
    if (hasALL(dataBar)) return void (0)
    isSplit.current = true

    const range = window.getSelection().getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(focusNode)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    const cursorPosition = preCaretRange.toString().trim().length
    if ([maxLength, 0].includes(cursorPosition)) return void (0)

    const params = splitCb(dataBar, id, [cursorPosition, maxLength], [cursorPosition, maxLength])
    setCache({
      type: 'split',
      dataBar,
      startId: id,
      endId: id,
      ...params
    })
  }

  const mergeCb = (dataBar, startId, endId) => {
    const num = endId - startId + 1
    const sourcePositions = []
    const targetPositions = []

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
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || endId <= startId) return void (0)
    const {
      sourcePositions,
      targetPositions
    } = mergeCb(dataBar, startId, endId)
    setCache({
      type: 'merge', dataBar, startId, endId, sourcePositions, targetPositions
    })
  }

  const exchangeCb = (startId, endId) => {
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
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || !hasALL(dataBar)) return void (0)
    setCache({
      type: 'exchange',
      dataBar,
      startId,
      endId
    })
    exchangeCb(startId, endId)
  }

  const moveUpCb = (dataBar, startId, endId) => {
    const getMoveUpfn = dataList => produce(dataList, draft => {
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
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || startId <= 0) return void (0)
    setCache({
      type: 'moveUp',
      dataBar,
      startId,
      endId
    })
    moveUpCb(dataBar, startId, endId)
  }

  const moveDownCb = (dataBar, startId, endId) => {
    const getMoveDownfn = dataList => produce(dataList, draft => {
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
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || endId >= maxListLength - 1) return void (0)
    setCache({
      type: 'moveDown',
      dataBar,
      startId,
      endId
    })
    moveDownCb(dataBar, startId, endId)
  }

  const updateCb = (dataBar, startId, endId, contSources = [], contTargets = []) => {
    const params = {}
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
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar) return void (0)
    setCache({
      type: 'delete',
      dataBar,
      startId,
      endId,
      ...updateCb(dataBar, startId, endId)
    })
  }

  const insertCb = (dataBar, startId, num, contSources = [], contTargets = []) => {
    const sourcefn = () => setSourceList(prevState => produce(prevState, draft => { draft.splice(startId, num, ...contSources) }))
    const targetFn = () => setTargetList(prevState => produce(prevState, draft => { draft.splice(startId, num, ...contTargets) }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const insertRow = () => {
    const { dataBar, startId } = getSelectedNodes()
    if (!dataBar) return void (0)
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
    if (!records || !recordStep) return void (0)
    const {
      type, dataBar, startId, endId, contSources, contTargets, searchVal, replaceVal, sourcePositions, targetPositions
    } = records.find(v => v.step === recordStep)

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
    if (!records) return void (0)
    if (records[records.length - 1].step <= getLocal('recordStep')) return void (0)
    setLocal('recordStep', getLocal('recordStep') + 1)
    const recordStep = Number(getLocal('recordStep'))
    const {
      type, dataBar, startId, endId, searchVal, replaceVal, sourcePositions, targetPositions, afterContSources, afterContTargets
    } = records.find(v => v.step === recordStep)

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

  const monitorKeyboard = debounce(e => {
    if (!e.ctrlKey || !sourceList.length || !targetList.length) return void (0)
    const actions = new Map([
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
    actions.get(e.keyCode)()
  }, 300)

  const _exportData = () =>exportData(new Array(maxListLength).fill(1).map((v,i)=>{
      return {
        "id": i+1,
        "contSource": sourceList[i],
        "contTarget": targetList[i]
      }
    }))

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
    const renderLi = list => list.map((v, i) => <li key={i} title={v.title} onClick={v.onClick}>{v.name}</li>)

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
    const oldBarAndId = useRef([])

    const changeIsContentEditable = (e, boo, boxShadow, event) => {
      e.target.contentEditable = boo
      e.target.style.boxShadow = boxShadow
      if (event) {
        clearAllNodeSelected()
        addNodesSelected(e.target.parentNode)
        e.target[event]()
        const range = window.getSelection()
        range.selectAllChildren(e.target)
        range.collapseToEnd()
      }
    }

    const updateData = debounce((e, dataBar, id) => {
      if (isSplit.current) {
        isSplit.current = false
        return void (0)
      }
      changeIsContentEditable(e, false, 'none')
      const params = {}
      params[`afterCont${dataBar}s`] = [e.target.innerText]
      setCache({
        type: 'update',
        dataBar,
        startId: id,
        endId: id,
        ...updateCb(dataBar, id, id, [e.target.innerText], [e.target.innerText]),
        ...params
      })
    })

    const clearAllNodeSelected = () => document.querySelectorAll(`.${SELECTED}`).forEach(v => v.classList.remove(SELECTED))

    const addNodesSelected = nodes => nodes.length && nodes.forEach(v => v.classList.add(SELECTED))

    const getSubscriptArr = (start, end) => new Array((Math.abs(end - start)) + 1).fill(Math.min(start, end)).map((v, i) => v + i)

    //There is no conflict without virtual dom
    const getClickNodes = (e) => {
      let nodes = [e.target.parentNode]
      const [dataBar, id] = getBarAndId(e.target)
      if (!dataBar) return void (0)
      const ifDataBarToEqualALL = hasALL(dataBar)
      const nodes_DATABAR_ALL = [...e.target.parentNode.parentNode.childNodes]
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
              ? selectedIds.map(v => [...document.querySelector(`span[data-bar=${dataBar}-${v}]`).parentNode.parentNode.childNodes]).flat()
              : selectedIds.map(v => document.querySelector(`div[data-bar=${dataBar}-${v}]`).parentNode)
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

    const TdToSpan = ({ id }) =>
      <td>
        <span className="number" data-bar={`${ALL}-${id}`}>{id + 1}</span>
      </td>


    const TdToP = (props) => {
      const { onDoubleClick, onBlur, text, direction, id } = props

      // const className = [
      //   !text && 'disabled'
      // ].filter(a => a).join(' ')

      return <td>
        <div suppressContentEditableWarning   //maybe input
          data-bar={`${direction}-${id}`}
          onDoubleClick={onDoubleClick}
          onBlur={onBlur}
          dangerouslySetInnerHTML={{ __html: purify.sanitize(text) }}
        />
      </td>
    }

    return <section className={`${PrefixCls}-content-wrap`}>
      <div className={`${PrefixCls}-content`}>
        <table cellSpacing='0' cellPadding='0'>
          <tbody>
            {new Array(maxListLength).fill('').map((v, i) => <tr key={i} onClick={getClickNodes}>
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
            )}
          </tbody>
        </table>
      </div>
    </section>
  }, [sourceList, targetList])

  const getInit = () => {
    let _sourceList = []
    let _targetList = []
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
    <Modal visible={visible}
      onClose={onCloseModal}
      searchKeyWord={searchKeyWord}
      replaceAllKeyWord={replaceAllKeyWord}
    />
  </div>
}

Align.defaultProps = {
  dataList: [],
  exportData:()=>{}
}

Align.propTypes = {
  dataList: PropTypes.array,
  exportData: PropTypes.func
}

export default Align
