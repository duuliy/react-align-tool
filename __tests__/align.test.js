import React from 'react'
import { shallow } from 'enzyme'
import Align from '../src/index'
import dataList from '../example/mockData.json'

describe(' <Align />', () => {
  let wrapper
  const exportData = data => {
    console.log(data)
  }
  beforeEach(() => {
    wrapper = shallow(<Align dataList={dataList} exportData={exportData}/>)
  })
  it('snapshot', () => {
    const app = wrapper.debug()
    expect(app).toMatchSnapshot()
  })
  it('normal rendering', () => {
    expect(wrapper.find('.align-tool-content-wrap')).toHaveLength(1)
  })
})
