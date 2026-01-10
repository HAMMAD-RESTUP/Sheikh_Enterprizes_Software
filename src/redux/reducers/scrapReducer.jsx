import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// --- 1. Fetch Transactions Thunk ---
export const fetchTransactions = createAsyncThunk(
  'scrap/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  transactions: [],
  totalScrapIn: 0,
  totalScrapOut: 0,
  totalPayable: 0,
  totalReceivable: 0,
  totalProfit: 0, // Ye Net Profit store karega
  totalSalesValue: 0,
  totalPurchaseCost: 0,
  loading: false,
  error: null
};

const scrapSlice = createSlice({
  name: 'scrap',
  initialState,
  reducers: {
    setAllTransactions: (state, action) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        
        // Reset Totals before calculation
        let scrapIn = 0;
        let scrapOut = 0;
        let payable = 0;
        let receivable = 0;
        let salesValue = 0;
        let purchaseCost = 0;

        action.payload.forEach(item => {
          const amount = Number(item.totalAmount) || 0;
          const remaining = Number(item.remainingAmount) || 0;

          // --- PURCHASE LOGIC ---
          if (item.type === 'purchase') {
            const itemWeight = item.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
            scrapIn += itemWeight;
            payable += remaining;
            purchaseCost += amount; // Kharidari ka kharcha
          } 
          
          // --- SALES LOGIC (Check for 'sales' or 'sell') ---
          else if (item.type === 'sales' || item.type === 'sell') {
            // Agar sales mein bhi items array hai to wahan se weight nikalein warna totalWeight se
            const sellWeight = item.totalWeight || item.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
            scrapOut += Number(sellWeight);
            receivable += remaining;
            salesValue += amount; // Kitne ka maal becha
          }
        });

        // Final State Updates
        state.totalScrapIn = scrapIn;
        state.totalScrapOut = scrapOut;
        state.totalPayable = payable;
        state.totalReceivable = receivable;
        state.totalSalesValue = salesValue;
        state.totalPurchaseCost = purchaseCost;
        
        // --- PROFIT CALCULATION ---
        state.totalProfit = salesValue - purchaseCost;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setAllTransactions } = scrapSlice.actions;
export default scrapSlice.reducer;