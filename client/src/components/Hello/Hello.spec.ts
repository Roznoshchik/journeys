import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import Hello from "./Hello.svelte";

describe("Hello Details", () => {
  it("Should render text to screen", () => {
    const { getByText } = render(Hello);

    expect(() => getByText(/Hello/i)).not.toThrow();
    expect(() => getByText(/Pikachy/i)).toThrow();
  });
});
