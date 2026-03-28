import { atom } from "jotai";
import { VMProperty } from "@/components/rive-animation.component";

export interface RiveApi {
  enumValues: VMProperty[];
  boolValues: VMProperty[];
  triggerValues: VMProperty[];
  setEnum: (name: string, value: string) => void;
  setBool: (name: string, value: boolean) => void;
  fireTrigger: (name: string) => void;
}

export const riveApiAtom = atom<RiveApi | null>(null);
