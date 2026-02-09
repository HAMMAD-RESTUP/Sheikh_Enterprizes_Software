import { configureStore } from '@reduxjs/toolkit';
import transactionSlice from './reducers/transactionSlice'; // Path check kar lein

export const store = configureStore({
  reducer: {
    scrap: transactionSlice,
  },
});