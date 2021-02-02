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
  const count = useRef(0)
  const [coordinate, setCoordinate] = useState({ direction: '', ids: [] })
  const maxLength = Math.max(sourceList.length, targetList.length)

  const changeIsContentEditable = (ref, boo, boxShadow, event) => {
    console.log(666)
    ref.current.contentEditable = boo
    ref.current.style.boxShadow = boxShadow
    if (event) {
      ref.current[event]()
      const range = window.getSelection()
      range.selectAllChildren(ref.current)
      range.collapseToEnd()
    }
  }

  const isSource = direction => direction === SOURCE

  const updateData = (ref, direction, id) => {
    changeIsContentEditable(ref, false, 'none')
    const _data = produce(isSource(direction) ? sourceList : targetList, draft => draft.map((v, i) => i === id ? ref.current.innerText : v))
    isSource(direction) ? onChangeSource(_data) : onChangeTarget(_data)
  }

  const combinationEvent = (e, ref, direction, id) => {
    // const _data = getActiveData(direction, id)
    const param = {
      direction,
      ids: [id]
    }
    setCoordinate(param)
  }

  const getClickFunc = (e, ref, direction, id) => {
    // console.log(e.shiftKey) boo 组合事件
    combinationEvent(e, ref, direction, id)
    // count.current += 1
    // setTimeout(() => {
    //   console.log(count.current)
    //   if (count.current === 1) {
    //     combinationEvent(e, ref, direction, id)
    //   } else if (count.current === 2) {
    //     direction !==ALL && changeIsContentEditable(ref, true, 'inset 0 0 5px #1890ff', 'focus')
    //     // combinationEvent(e, ref, direction, id)
    //   }
    //   count.current = 0
    // }, 200)
  }

  const TdToSpan = ({ id, onClick }) => {
    const _ref = createRef(null)

    return <td className={coordinate.direction === ALL && coordinate.ids.includes(id) ? 'selected' : null}
      ref={_ref}
      onClick={(e) => onClick(e, _ref)}
    >
      <span className="number">{id + 1}</span>
    </td>
  }

  const TdToP = (props) => {
    const { onClick, onDoubleClick, onBlur, text, id, direction } = props
    const _ref = createRef(null)

    const className = [
      ([direction, ALL].includes(coordinate.direction) && coordinate.ids.includes(id) && text) && 'selected',
      !text && 'disabled'
    ].filter(a => a).join(' ')

    return <td className={className}>
      <div suppressContentEditableWarning
        ref={_ref}
        onClick={(e) => onClick(e, _ref)}
        onDoubleClick={() => onDoubleClick(_ref)}
        // onDoubleClick={()=>console.log(666)}
        onBlur={() => onBlur(_ref)}
      >{text}</div>
    </td>
  }

  return <section className={`${PrefixCls}-content-wrap`}>
    <div className={`${PrefixCls}-content`}>
      <table cellSpacing='0' cellPadding='0'>
        <tbody>
          {new Array(maxLength).fill('').map((v, i) => <tr key={i}>
            <TdToSpan
              onClick={(e, ref) => getClickFunc(e, ref, ALL, i)}
              id={i}
            />
            <TdToP
              onClick={(e, ref) => getClickFunc(e, ref, SOURCE, i)}
              onDoubleClick={ref =>changeIsContentEditable(ref, true, 'inset 0 0 5px #1890ff', 'focus')}
              // onDoubleClick={()=>console.log(666)}
              onBlur={ref => updateData(ref, SOURCE, i)}
              id={i}
              direction={SOURCE}
              text={sourceList[i]}
            />
            <TdToP
              onClick={(e, ref) => getClickFunc(e, ref, TARGET, i)}
              onDoubleClick={ref => changeIsContentEditable(ref, true, 'inset 0 0 5px #1890ff', 'focus')}
              onBlur={ref => updateData(ref, TARGET, i)}
              id={i}
              direction={TARGET}
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
    setTargetList(_targetList.filter(v => !!v))
  }

  useEffect(() => {
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
