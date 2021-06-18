import React from 'react'
import dataList from './mockData.json'
import Align from '../src/index.ts'


const Example=()=>{
  const exportData=data=>{
    console.log(data)
  }

  return <Align dataList={dataList} exportData={exportData}/>
}

export default Example