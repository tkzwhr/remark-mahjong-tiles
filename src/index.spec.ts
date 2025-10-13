import { beforeEach, describe, expect, it } from "vitest";
import { setupCounter } from "./index";

describe("setupCounter", () => {
  let button: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '<button id="counter" type="button"></button>';
    const foundButton = document.querySelector<HTMLButtonElement>("#counter");
    if (!foundButton) {
      throw new Error(
        "Test setup failed: button element with id 'counter' not found.",
      );
    }
    button = foundButton;
  });

  it("should set initial count to 0", () => {
    setupCounter(button);
    expect(button.innerHTML).toBe("count is 0");
  });

  it("should increment counter on click", () => {
    setupCounter(button);
    button.click();
    expect(button.innerHTML).toBe("count is 1");
    button.click();
    expect(button.innerHTML).toBe("count is 2");
  });
});
