import { createContext, useContext } from "react";
import { en, type Messages } from "./en";

/** The texts of the current language. `App` provides them. */
export const MessagesContext = createContext<Messages>(en);

export const useMessages = () => useContext(MessagesContext);
