/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

import React, { useRef, createRef, useEffect, useState } from 'react'
import './style.less'
import { produce } from 'immer'
import dataList from './mockData.json'


//cicd 整一套
//颜色切换
//功能选择
//上传导出地址输入

const PrefixCls = 'align-tool'
const LEFT = 'Left'
const RIGHT = 'Right'

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

  const renderLi = _list => _list.map((v, i) => <li key={i}>{v.name}</li>)


  return <section className={`${PrefixCls}-header`}>
    <ul>
      {renderLi(leftList)}
    </ul>
    <ul>
      {renderLi(rightList)}
    </ul>
  </section>
}

const Content = ({ data, onChange }) => {
  const count = useRef(0)

  const changeIsContentEditable = (ref, boo, boxShadow, event) => {
    ref.current.contentEditable = boo
    ref.current.style.boxShadow = boxShadow
    if (event){
      ref.current[event]()
      const _range = window.getSelection()
      _range.selectAllChildren(ref.current)
      _range.collapseToEnd()
    }
  }


  const changeData = (ref, direction, id) => {
    changeIsContentEditable(ref, false, 'none')
    const _data = produce(data, draft => {
      draft.forEach(v => v.id === id && (v[`cont${direction}`] = ref.current.innerText))
    })
    onChange(_data)
  }

  const combinationEvent = (e, ref, direction, id)=>{
    // parentNode
    // console.log(ref.current.parentNode.className )
    // Virtual DOM
    ref.current.parentNode.className='active'
  }

  const getClickFunc = (e, ref, direction, id) => {
    // console.log(e.shiftKey) boo 作多选
    count.current += 1
    setTimeout(() => {
      if (count.current === 1) {
        combinationEvent(e, ref, direction, id)
      } else if (count.current === 2) {
        changeIsContentEditable(ref, true, 'inset 0 0 5px #1890ff', 'focus')
      }
      count.current = 0
    }, 200)
  }

  const TdToP = ({ params, text }) => {
    const { onClick, onBlur } = params
    const _ref = createRef(null)

    return <td>
      <div suppressContentEditableWarning 
        ref={_ref}
        onClick={(e)=> onClick(e,_ref)}
        onBlur={() => onBlur(_ref)}
      >{text}</div>
    </td>
  }

  return <section className={`${PrefixCls}-content-wrap`}>
    <div className={`${PrefixCls}-content`}>
      <table cellSpacing='0' cellPadding='0'>
        <tbody>
          {data.map((v, i) => <tr key={v.id}>
            <td>
              <span className="number">{i + 1}</span>
            </td>
            <TdToP
              params={{
                onClick: (e, _ref) => getClickFunc(e, _ref, LEFT, v.id),
                onBlur: _ref => changeData(_ref, LEFT, v.id)
              }}
              text={v.contLeft}
            />
            <TdToP
              params={{
                onClick: _ref => getClickFunc(_ref, RIGHT, v.id),
                onBlur: _ref => changeData(_ref, RIGHT, v.id)
              }}
              text={v.contRight}
            />
          </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
}


const Align = () => {
  const [data, setData] = useState(dataList)

  useEffect(() => {
  }, [])

  return <div className={PrefixCls}>
    <Header />
    <Content data={data} onChange={_data => setData(_data)} />
    <section className={`${PrefixCls}-footer`}>
      总行数：36
    </section>
  </div>

}

export default Align
