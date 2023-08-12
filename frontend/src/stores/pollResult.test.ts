import {setActivePinia, createPinia} from "pinia";
import {usePollResultStore} from "../stores/pollResult";
import {beforeEach, describe} from "vitest";

describe("Poll Result Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

})