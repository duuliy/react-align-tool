/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

import React, { useRef, createRef, useEffect, useState, memo } from 'react'
import './style.less'
import { produce } from 'immer'
import dataList from './mockData.json'


//cicd 整一套
//颜色切换
//功能选择
//上传导出地址输入

const PrefixCls = 'align-tool'
//参数切换
const SOURCE = 'Source'
const TARGET = 'Target'
const CONT = 'cont'
const ALL = 'all'
const SELECTED = 'selected'

const Header = () => {
  const leftList = [
    {
      name: '回退',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '前进',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '合并',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '拆分',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '上移',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '回退',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '下移',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '调换',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '插入',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '删除',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '查找',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '替换',
      icon: '',
      funcCb: () => { }
    },
  ]
  const rightList = [
    {
      name: '上传',
      icon: '',
      funcCb: () => { }
    },
    {
      name: '导出',
      icon: '',
      funcCb: () => { }
    },
  ]

  const renderLi = list => list.map((v, i) => <li key={i}>{v.name}</li>)


  return <section className={`${PrefixCls}-header`}>
    <ul>
      {renderLi(leftList)}
    </ul>
    <ul>
      {renderLi(rightList)}
    </ul>
  </section>
}

const Content = ({ sourceList, targetList, onChangeSource, onChangeTarget }) => {
  let oldBarAndId = useRef([])
  const maxLength = Math.max(sourceList.length, targetList.length)

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

  const isSource = direction => direction === SOURCE

  const updateData = (e, direction, id) => {
    changeIsContentEditable(e, false, 'none')
    const _data = produce(isSource(direction) ? sourceList : targetList, draft => draft.map((v, i) => i === id ? e.target.innerText : v))
    isSource(direction) ? onChangeSource(_data) : onChangeTarget(_data)
  }

  const hasDisabled = node => node.classList.contains('disabled')

  const clearAllNodeSelected = () => document.querySelectorAll(`.${SELECTED}`).forEach(v => v.classList.remove(SELECTED))

  const addNodesSelected = nodes => nodes.length && nodes.filter(v => !hasDisabled(v)).forEach(v => v.classList.add(SELECTED))

  const getBarAndId = node => node.getAttribute('data-bar').split('-')

  const getSubscriptArr = (start, end) => new Array((Math.abs(end - start)) + 1).fill(Math.min(start, end)).map((v, i) => v + i)

  //There is no conflict without virtual dom
  const getClickNodes = (e) => {
    let nodes = [e.target.parentNode]
    const [dataBar, id] = getBarAndId(e.target)
    const ifDataBarToEqualALL = dataBar === ALL
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

  const combinationEvent = (e, ref, direction, id) => {

  }

  const TdToSpan = ({ id }) =>
    <td>
      <span className="number" data-bar={`${ALL}-${id}`}>{id + 1}</span>
    </td>


  const TdToP = (props) => {
    const { onDoubleClick, onBlur, text, direction, id } = props

    const className = [
      !text && 'disabled'
    ].filter(a => a).join(' ')

    return <td className={className}>
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
          {new Array(maxLength).fill('').map((v, i) => <tr key={i} onClick={getClickNodes}>
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


const Align = () => {
  const [sourceList, setSourceList] = useState([])
  const [targetList, setTargetList] = useState([])

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
    getInit()
  }, [])

  return <div className={PrefixCls}>
    <Header />
    <Content sourceList={sourceList}
      targetList={targetList}
      onChangeSource={setSourceList}
      onChangeTarget={setTargetList}
    />
    <section className={`${PrefixCls}-footer`}>
      总行数：36
    </section>
  </div>

}

export default Align
