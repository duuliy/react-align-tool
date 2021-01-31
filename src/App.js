/**
 * @name react-align-tool
 * @description The function used for document alignment may be very small
 * @author Duuliy <715181149@qq.com>
 * @license MIT
 */

import React, { Fragment } from 'react'
import './style.less'
import data from './mockData.json'


//cicd 整一套
//颜色切换
//功能选择
//上传导出地址输入

const PrefixCls = 'align-tool'

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

const Content = ({ _data }) => {

  return <section className={`${PrefixCls}-content-wrap`}>
    <div className={`${PrefixCls}-content`}>
      <table cellSpacing='0' cellPadding='0'>
        <tbody>
          {_data.map((v, i) => <tr key={v.id}>
            <td>
              <span className="number">{i+1}</span>
            </td>
            <td>
              <p>{v.contLeft}</p>
            </td>
            <td>
              <p>{v.contRight}</p>
            </td>
          </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
}


const Align = () => {
  return <div className={PrefixCls}>
    <Header />
    <Content _data={data} />
    <section className={`${PrefixCls}-footer`}>
      总行数：36
    </section>
  </div>

}

export default Align
