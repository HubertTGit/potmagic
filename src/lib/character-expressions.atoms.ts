import { atom } from "jotai";

/**
 * Stores the current facial expression state for all characters on the stage.
 * Map: sceneCastId -> { expressionName -> isActive }
 * Example: { "cast-123": { "laughing": true, "blink": false } }
 */
export const characterExpressionsAtom = atom<Record<string, Record<string, boolean>>>({});
