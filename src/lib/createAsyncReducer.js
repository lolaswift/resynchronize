import { AsyncActions } from './createAsyncActions'
import { createReducer } from './utils'

const ASYNC_INITIAL_STATE = { status: null, payload: null, error: null }

/**
 * Handlers for async actions
 * The reducer is used on the afected property to avoid structure changes on how the library behaves
 * Status is managed by the library and cannot be altered, but the payloads can be updated using custom
 * reducers
 */
const handleStart = reducer => (state, action) => ({
  status: 'START',
  payload: reducer(state.payload, action),
  error: null
})

const handleDone = reducer => (state, action) => ({
  status: 'DONE',
  payload: reducer(state.payload, action),
  error: null
})

const handleError = reducer => (state, action) => ({
  status: 'ERROR',
  payload: state.payload,
  error: reducer(state.error, action)
})

const handleReset = reducer => (state, action) => ({
  status: null,
  payload: reducer(state.payload, action),
  error: null
})

/** default reducer for async handling */
const defaultReducer = (state = null, { payload = null }) => payload || state

/**
 * Basic action handler creator for async actions
 * @param {object} actions Async actions
 */
const createActionsHandler = (actions, { start, done, reset, error } = {}) => ({
  [actions.START]: handleStart(start || defaultReducer),
  [actions.DONE]: handleDone(done || defaultReducer),
  [actions.ERROR]: handleError(error || defaultReducer),
  [actions.RESET]: handleReset(reset || defaultReducer)
})

/**
 * Create a reducer config to handle async actions
 * @param {*} asyncActions Set of actions that include every state of a fetch process
 * @param {*} asyncHandlers Set of action reducers
 * @returns {object} config to be used on a reducer
 */
const createAsyncReducerConfig = (asyncActions, asyncHandlers) => {
  let config = {}

  // If isnt an AsyncActions all the keys of the object are put into the main reducer
  if (AsyncActions.prototype.isPrototypeOf(asyncActions)) {
    config = createActionsHandler(asyncActions, asyncHandlers)
  } else {
    Object.keys(asyncActions).forEach(actionKey => {
      config = {
        ...config,
        ...createActionsHandler(asyncActions[actionKey], asyncHandlers)
      }
    })
  }

  return config
}

/**
 * Create a reducer function to handle async actions
 * @param {*} asyncActions Set of actions that include every state of a fetch process
 * @param {*} asyncHandlers Set of action reducers
 * @returns {function} async reducer
 */
export const createAsyncReducer = (asyncActions, asyncHandlers) =>
  createReducer(
    ASYNC_INITIAL_STATE,
    createAsyncReducerConfig(asyncActions, asyncHandlers)
  )

export {
  createAsyncReducer as default,
  createAsyncReducerConfig,
  defaultReducer
}
