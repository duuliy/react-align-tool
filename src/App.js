/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

import React, { useRef, useEffect, useState, memo, useMemo } from 'react'
import './style.less'
import { produce } from 'immer'
import dataList from './mockData.json'


//cicd 整一套
//颜色切换
//功能选择
//上传导出地址输入

//上传,保存,导出，回退，前进
//快捷键 菜单

const PrefixCls = 'align-tool'
const SOURCE = 'Source'
const TARGET = 'Target'
const CONT = 'cont'
const ALL = 'all'
const SELECTED = 'selected'


const Align = () => {
  const [sourceList, setSourceList] = useState([])
  const [targetList, setTargetList] = useState([])
  const maxListLength = Math.max(sourceList.length, targetList.length)

  const getBarAndId = node => (node.getAttribute('data-bar') || '').split('-')

  const hasALL = dataBar => dataBar === ALL

  // const hasNode_All = nodes => nodes.findIndex(v => getBarAndId(v)[0] === ALL) !== -1

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

  //查找 替换

  const splitRow = () => {
    console.log(666)
    console.log(document.querySelector('div[contentEditable=true]'))
    // let range = window.getSelection().getRangeAt(0)
    // console.log(range)
    // var preCaretRange = range.cloneRange()
    // preCaretRange.selectNodeContents(element)
    // preCaretRange.setEnd(range.endContainer, range.endOffset)
    // return preCaretRange.toString().trim().length
  }

  const mergeRow = (e) => {
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || endId <= startId ) return void (0)
    const num = endId - startId + 1
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      const selectedItem = draft.splice(startId, num).join('')
      draft.splice(startId, 0, selectedItem) 
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => { 
      const selectedItem = draft.splice(startId, num).join('')
      draft.splice(startId, 0, selectedItem) 
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const exchangeRow = () => {
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || !hasALL(dataBar)) return void (0)
    const num = endId - startId + 1
    setSourceList(produce(sourceList, draft => {
      const targetReplace = targetList.slice(startId, endId - 0 + 1)
      console.log(targetReplace)
      draft.splice(startId, num, ...targetReplace)
    }))
    setTargetList(produce(targetList, draft => {
      const sourceReplace = sourceList.slice(startId, endId - 0 + 1)
      draft.splice(startId, num, ...sourceReplace)
    }))
  }

  const moveUpRow = () => {
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || startId <= 0) return void (0)
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      const deletedItems = draft.splice(startId - 0 - 1, 1)
      draft.splice(endId, 0, ...deletedItems)
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      const deletedItems = draft.splice(startId - 0 - 1, 1)
      draft.splice(endId, 0, ...deletedItems)
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const moveDownRow = () => {
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar || endId >= maxListLength - 1) return void (0)
    const sourcefn = () => setSourceList(produce(sourceList, draft => {
      const deletedItems = draft.splice(endId - 0 + 1, 1)
      draft.splice(startId, 0, ...deletedItems)
    }))
    const targetFn = () => setTargetList(produce(targetList, draft => {
      const deletedItems = draft.splice(endId - 0 + 1, 1)
      draft.splice(startId, 0, ...deletedItems)
    }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const deleteRow = () => {
    const { dataBar, startId, endId } = getSelectedNodes()
    if (!dataBar) return void (0)
    const num = endId - startId + 1
    const sourcefn = () => setSourceList(produce(sourceList, draft => { draft.splice(startId, num) }))
    const targetFn = () => setTargetList(produce(targetList, draft => { draft.splice(startId, num) }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const insertRow = () => {
    const { dataBar, startId } = getSelectedNodes()
    if (!dataBar) return void (0)
    const sourcefn = () => setSourceList(produce(sourceList, draft => { draft.splice(startId, 0, '') }))
    const targetFn = () => setTargetList(produce(targetList, draft => { draft.splice(startId, 0, '') }))
    const allFn = () => {
      sourcefn()
      targetFn()
    }
    executeDataBarBranchFn(dataBar, allFn, sourcefn, targetFn)
  }

  const Header = () => {
    const leftList = [
      {
        name: '回退',
        icon: '',
        title: 'Ctrl + Z',
        onClick: () => { }
      },
      {
        name: '前进',
        icon: '',
        title: 'Ctrl + Y',
        onClick: () => { }
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
        title: 'Delete',
        onClick: deleteRow
      },
      {
        name: '查找',
        icon: '',
        onClick: () => { }
      },
      {
        name: '替换',
        icon: '',
        onClick: () => { }
      },
    ]
    const rightList = [
      {
        name: '上传',
        icon: '',
        funcCb: () => { }
      },
      {
        name: '保存',
        icon: '',
        title: 'Ctrl + I',
        funcCb: () => { }
      },
      {
        name: '导出',
        icon: '',
        funcCb: () => { }
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

  const Content = () => {
    let oldBarAndId = useRef([])

    const changeIsContentEditable = (e, boo, boxShadow, event) => {
      e.target.contentEditable = boo
      e.target.style.boxShadow = boxShadow
      if (event) {
        // clearAllNodeSelected()
        addNodesSelected(e.target.parentNode)
        e.target[event]()
        const range = window.getSelection()
        range.selectAllChildren(e.target)
        range.collapseToEnd()
      }
    }

    const isSource = direction => direction === SOURCE

    const updateData = (e, direction, id) => {
      changeIsContentEditable(e, false, 'none')
      const _data = produce(isSource(direction) ? sourceList : targetList, draft => draft.map((v, i) => i === id ? e.target.innerText : v))
      isSource(direction) ? setSourceList(_data) : setTargetList(_data)
    }

    // const hasDisabled = node => node.classList.contains('disabled')

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
        if (oldBarAndId.length) {
          const [_dataBar, _id] = oldBarAndId
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
      oldBarAndId = [dataBar, saveIdsLength === 1 ? id : oldId]
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
        >{text}</div>
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
  }

  const getInit = () => {
    const _sourceList = []
    const _targetList = []
    dataList.forEach(v => {
      _sourceList.push(v[`${CONT + SOURCE}`])
      _targetList.push(v[`${CONT + TARGET}`])
    })
    setSourceList(_sourceList.filter(v => !!v))
    setTargetList(_targetList)
  }

  useEffect(() => {
    // addEventListener('keydown' 键盘订阅
    // onContextMenu 右键菜单
    // 检测页面刷新
    getInit()
  }, [])

  return <div className={PrefixCls}>
    <Header />
    <Content />
    <section className={`${PrefixCls}-footer`}>
      总行数：36
    </section>
  </div>

}

export default Align
