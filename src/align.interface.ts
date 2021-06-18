import * as React from 'react'
export type ModalOptions = {
  visible: Boolean
  onClose: () => void
  searchKeyWord: (val: string | null) => void
  replaceAllKeyWord: (searchVal: string | null, replaceVal: string | null) => void
}

export type DataListType = {
  contSource?: string
  contTarget?: string
  id?: string
  [key: string]: any
}

export interface AlignProps {
  dataList: DataListType[]
  exportData?: (data: DataListType[]) => void
  // children?: React.ReactNode;
}

export type RecordStepType = number

export type SourceListType = string[]

export type TargetListType = SourceListType

interface RecordsGeneralInterface {
  step?: number
  dataBar: string
  startId: number
  endId: number
}

export interface GeneralFnInterface extends Omit<RecordsGeneralInterface, 'step'>{
  type: 'replace' | 'split' | 'merge' | 'exchange' | 'moveUp' | 'moveDown' | 'delete' | 'insert' | 'update'
  sourcePositions?: number[]
  targetPositions?: number[]
  contSources?: string[]
  contTargets?: string[]
  searchVal?: string
  replaceVal?: string
  afterContSources?: string[]
  afterContTargets?: string[]
}

// type RecordsReplaceType = Omit<RecordsGeneralInterface, 'startId' | 'endId' | 'dataBar'>
type RecordsReplaceType = Pick<RecordsGeneralInterface, 'step'>

export interface ReplaceInterface extends RecordsReplaceType{
  type: 'replace'
  searchVal:string
  replaceVal:string
}

export interface SplitInterface extends RecordsGeneralInterface {
  type: 'split'
  sourcePositions?: number[]
  targetPositions?: number[]
}

export interface MergeInterface extends RecordsGeneralInterface {
  type: 'merge'
  sourcePositions: number[]
  targetPositions: number[]
}

export interface ExchangeInterface extends RecordsGeneralInterface {
  type: 'exchange'
}

export interface MoveUpInterface extends RecordsGeneralInterface {
  type: 'moveUp'
}

export interface MoveDownInterface extends RecordsGeneralInterface {
  type: 'moveDown'
}

export interface DeleteInterface extends RecordsGeneralInterface {
  type: 'delete'
  contSources?: string[]
  contTargets?: string[]
}

export interface UpdateDataInterface extends RecordsGeneralInterface {
  type: 'update'
  contSources?: string[]
  afterContSources?: string[]
}

type RecordsInsertType = Omit<RecordsGeneralInterface, 'endId'>

export interface InsertInterface extends RecordsInsertType {
  type: 'insert'
}

export type RecordsType = ReplaceInterface | SplitInterface | MergeInterface | ExchangeInterface | MoveUpInterface | MoveDownInterface | DeleteInterface | InsertInterface | UpdateDataInterface

export type LocalValEntryType = RecordStepType | RecordsType[] | SourceListType | TargetListType

// export type LocalReturnType = RecordStepType & SourceListType & TargetListType & RecordsType

// export type LocalKeyType = 'recordStep' | 'records' | 'sourceList' | 'targetList'

export type LocalReturnType = {
  'recordStep': RecordStepType
  'records': RecordsType[]
  'sourceList': SourceListType
  'targetList': TargetListType
}

export type SplitCbImParams = Pick<GeneralFnInterface, 'sourcePositions' | 'targetPositions'>

export type UpdateCbImParams = Pick < GeneralFnInterface, 'contSources' | 'contTargets' >

export interface UpdateImParams extends Pick<GeneralFnInterface, 'afterContSources' | 'afterContTargets'>{
  [key: string]: string[] | undefined;
}

export type UiListType={
  name:string
  icon: string
  title?: string
  onClick: React.MouseEventHandler<HTMLLIElement>
}

export type UpdateDataBarType = 'Source' | 'Target'
export type GetSelectedNodesType = Pick<GeneralFnInterface, 'dataBar' | 'startId' | 'endId'>

export type TdToPType = {
  onDoubleClick: (e:React.MouseEvent<HTMLElement>)=>void
  onBlur: (e: React.MouseEvent<HTMLSpanElement>) =>void
  text: string
  direction: UpdateDataBarType
  id: number
}


