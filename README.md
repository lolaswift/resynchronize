# RESYNCHRONIZE
![npm (scoped)](https://img.shields.io/azure-devops/coverage/swellaby/opensource/25.svg)

Simple library / bunch of functionality / *bunch of notes* on files to fetch/promise async payloads and put a meaningful state for your application

This tries to follow the standards put on place by the creators of redux, but it's still opinionated, feel free to add your own pretty features!


## Requirements
- `redux` Where you store the magical/not-as-magical-as-you-though async nodes
- `redux-thunk` Your redux state need some way to dispatch actions from… another dispatch :surprise:
- `react-redux` It's required to use the functionality with react

## Further details

Every async node has the same shape:
```javascript
{
  status: 'START',
  payload: null,
  error: null
}
```

Along with this shape there are functions to retrieve readable / understandable / comparable properties, they use the state node as argument and return a boolean:

- `isDone` if the request / promise is done
- `isLoading` if is still pending
- `getError` if has errors, returns an error object
- `getPayload` gets the payload, is not dependant of the previous methods, can be used anytime
- `getAsyncProps` returns an object with all the properties set of the node:
-- `payoad`
-- `loading`
-- `done`
-- `error`
- `getGetterAsyncProps` serves as `map state to props` function using the `getter` prop on the component to get the async props

## How to set up Redux to use this beauty

The flow is as usual, create actions, set up reducers, dispatch said actions, but with a twist.

### Step I
To create 'async actions' we use `createAsyncActions`: this creates a set of 4 actions to follow the natural state of any asynchronous action: `START`, `DONE`, `ERROR` and `RESET`

```javascript
const getListAction = createAsyncActions('GET_LIST')
```

### Step II
With this action object (the actions are inside as properties) and a simple `thunk` we set up a method that uses these actions in the right moment, example:

```javascript
const getListAction = createAsyncActions('GET_LIST')

const getList = (dispatch, getState) =>
  // Started! it will take a moment, promise!
  dispatch(getListAction.START())

  fetch('http://random.api.com/list')
    .then(response => dispatch(getListAction.DONE(response))) // Done! there you have your stuff!
    .catch(exception => dispatch(getListAction.ERROR(exception))) // Error!

const resetList = (dispatch, getState) => {
  dispatch(getListAction.RESET())
}
```

In this example we use a common `fetch` and we tackle the different states of it with our async actions, meaning that if we dispatch the `getList` method every action will be triggered when is expected setting the async node accordingly.

This example can be used to create different sets of thunks that add controls or are more reusable in your app.

### Step III
With the async action object and the method `createAsyncReducer` we create the reducer for these actions, by default anything that comes as a result of the `DONE` action will be used as payload and any `ERROR` will fill the `error` property

```javascript
const listReducer = createAsyncReducer(getListAction)
```

The `createAsyncReducer` also receives a second argument, you can pass an object to further decide what to do with your payload when you receive it, example:

```javascript
const listReducer = createAsyncReducer(getListAction, {
  done: (state, { payload }) => payload.filter(item => !item.valid)
})
```

In this case we enhance the `done` reducer filtering anything that is not valid on our list payload, it is also possible to enhance every other reducer using `start`, `reset` and `error`

If you want to reduce multiple asyncActions with the same reducer is simple as sending a key -> action object shaped as the first argument:

```javascript
const listReducer = createAsyncReducer(
  {
    getListAction,
    refreshListAction
  },
  {
    done: (state, { payload }) => payload.filter(item => !item.valid)
  }
)
```

*Aaaaaand that's it, there you have a simple set up for your async actions on place, but wait.. there is more*

## How to set this up in my React components
Assuming that you already put in place `react-redux` the connection with this async nodes is simple as:

### THE example
```javascript
import { connect } from 'react-redux'
import { getList } from '../my-actions'

const connector = connect(
  state => ({
    listItems: getAsyncProps(state.myList)
  }),
  dispatch => ({
    dispatch,
    getMyList: () => dispatch(getList)
  })
)

const _myAwesomeComponent = ({
  listItems: { done, loading, payload },
  getMyList
}) => (
  <div>
    <button onClick={getMyList} disabled={loading}>
      Get items!
    </button>
    <ul>
      {loading && (
        <span>
          Loading items...
        </span>
      )}
      {done && payload.map(item => (
        <li>
          {item.name}
        </li>
      ))}
    </ul>
  </div>
)

const myAwesomeComponent = connector(_myAwesomeComponent)
```

The method `getAsyncProps` allows to get a meaningful set of properties that you can use to render the different async states on your component and the thunk created before allows you to dispatch the actions that start the async promise.

### When you dont like to repeat the same connector everywhere

As an extra sweet cherry on top you can the `getGetterAsyncProps`. This method allows you to connect any async node from state just putting a `getter` prop in the connected component. Using the previous example:

```javascript
import { connect } from 'react-redux'
import { getList } from '../my-actions'

const connector = connect(
  getGetterAsyncProps,
  dispatch => ({
    dispatch,
    getMyList: () => dispatch(getList)
  })
)

const _MyAwesomeComponent = ({
  listItems: { done, loading, payload },
  getMyList
}) => (
  <div>
    <button onClick={getMyList} disabled={loading}>
      Get items!
    </button>
    <ul>
      {loading && (
        <span>
          Loading items...
        </span>
      )}
      {done && payload.map(item => (
        <li>
          {item.name}
        </li>
      ))}
    </ul>
  </div>
)

const MyAwesomeComponent = connector(_MyAwesomeComponent)
```

And when you use it

```javascript
import MyAwesomeComponent from '../MyAwesomeComponent'

const myApp = () => (
  <MyAwesomeComponent getter={state => ({ listItems: myList })} />
)
```
