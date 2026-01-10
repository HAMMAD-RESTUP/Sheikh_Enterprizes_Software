import React from 'react'
import AppRouter from './Router/appRouter'

import { store } from './redux/store'
import { Provider } from 'react-redux';

function App() {
  return (
    <div>

      <Provider store={store}>
        <AppRouter />
      </Provider>

    </div>
  )
}

export default App
