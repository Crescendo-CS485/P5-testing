import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
(global as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
