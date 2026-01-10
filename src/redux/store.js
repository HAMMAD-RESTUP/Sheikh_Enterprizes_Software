import { configureStore } from '@reduxjs/toolkit';
import scrapReducer from '../redux/reducers/scrapReducer'; // Path check kar lein

export const store = configureStore({
  reducer: {
    scrap: scrapReducer,
  },
});