import questionReducer from "@/redux/slices/question-slice";
import readingReducer from "@/redux/slices/reading-slice";
import searchReducer from "@/redux/slices/search-slice";
import routeReducer from "@/redux/slices/route-slice";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";


const rootReducer = combineReducers({
    search: searchReducer,
    reading: readingReducer,
    question: questionReducer,
    route: routeReducer,
});

const persistedReducer = persistReducer({
    key: "root", // 储存的标识名
    storage, // 储存方式
    whitelist: ["reading", "question"],
}, rootReducer);
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch