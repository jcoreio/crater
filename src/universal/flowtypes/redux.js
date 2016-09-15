import {Map as iMap} from 'immutable'
import type {
  Store as _Store,
  Reducer as _Reducer,
  Dispatch as _Dispatch,
} from 'redux'

export type State = iMap<string, any>

export type Action = {
  type: $Subtype<String>,
  error?: boolean,
  meta?: Object,
}

export type Store = _Store<State, Action>
export type Dispatch = _Dispatch<Action>
export type Reducer = _Reducer<State, Action>
