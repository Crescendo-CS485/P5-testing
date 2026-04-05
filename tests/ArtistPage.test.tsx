import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { toast } from "sonner";
import ArtistPage, { formatTime } from "../frontend/src/app/pages/ArtistPage";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeArtist(overrides = {}) {
  return {
    id: "1",
    name: "Test Artist",
    image: "https://example.com/img.jpg",
    bio: "A test artist bio",
    activityScore: 7.5,
    discussionCount: 10,
    latestThread: { id: "disc-1", title: "Test thread", timestamp: "2h ago" },
    genres: ["Rock", "Pop"],
    ...overrides,
  };
}

function makeDiscussion(overrides = {}) {
  return {
    id: "d1",
    artistId: "1",
    title: "Test Discussion",
    postCount: 5,
    lastActivityAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    ...overrides,
  };
}

function renderPage(id = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/artists/${id}`]}>
        <Routes>
          <Route path="/artists/:id" element={<ArtistPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// ArtistPage component — tests 8–15
// ---------------------------------------------------------------------------

describe("ArtistPage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  // 8
  test("shows loading spinner when artist data is loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderPage("abc");
    expect(screen.getByText("Loading artist...")).toBeInTheDocument();
  });

  // 9
  test("shows not-found message when artist query returns 404", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    renderPage("unknown");
    await waitFor(() => {
      expect(screen.getByText("Artist not found.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to Discovery" })).toBeInTheDocument();
    });
  });

  // 10
  test("renders artist name, bio, genres, and image on success", async () => {
    const artist = makeArtist({ name: "Luna Rivera", bio: "A bio.", genres: ["Pop", "Indie"], image: "https://example.com/luna.jpg" });
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Luna Rivera" })).toBeInTheDocument();
      expect(screen.getByText("A bio.")).toBeInTheDocument();
      expect(screen.getByText("Pop")).toBeInTheDocument();
      expect(screen.getByText("Indie")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Luna Rivera" })).toHaveAttribute("src", "https://example.com/luna.jpg");
    });
  });

  // 11
  test("renders activity score with highlight color when score >= 8.5", async () => {
    const artist = makeArtist({ activityScore: 9.2 });
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("9.2")).toHaveClass("text-[#5b9dd9]");
    });
  });

  // 12
  test("renders activity score without highlight when score < 8.5", async () => {
    const artist = makeArtist({ activityScore: 6.0 });
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("6.0")).toHaveClass("text-white");
    });
  });

  // 13
  test("renders discussion list with titles, post counts, and relative times", async () => {
    const artist = makeArtist();
    const discussions = [
      makeDiscussion({ id: "d1", title: "First Thread", postCount: 3, lastActivityAt: new Date(Date.now() - 5 * 60_000).toISOString() }),
      makeDiscussion({ id: "d2", title: "Second Thread", postCount: 7, lastActivityAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString() }),
    ];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions, total: 2 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("First Thread")).toBeInTheDocument();
      expect(screen.getByText(/3 posts/)).toBeInTheDocument();
      expect(screen.getByText("Second Thread")).toBeInTheDocument();
      expect(screen.getByText(/7 posts/)).toBeInTheDocument();
      expect(screen.getByText(/5m ago/)).toBeInTheDocument();
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });
  });

  // 14
  test("shows empty discussion message when no discussions exist", async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("No discussions yet. Trigger LLM activity to generate some!")).toBeInTheDocument();
    });
  });

  // 16
  test("Back to Discovery link navigates to /", async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /back to discovery/i })).toHaveAttribute("href", "/");
    });
  });

  // 17
  test("discussion links navigate to /discussions/:id", async () => {
    const artist = makeArtist();
    const discussions = [makeDiscussion({ id: "d1", title: "Thread One" })];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /thread one/i })).toHaveAttribute("href", "/discussions/d1");
    });
  });

  // 18
  test('post count shows singular "post" when count is 1', async () => {
    const artist = makeArtist();
    const discussions = [makeDiscussion({ postCount: 1 })];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText(/1 post\b/)).toBeInTheDocument();
      expect(screen.queryByText(/1 posts/)).not.toBeInTheDocument();
    });
  });

  // 19
  test('post count shows plural "posts" when count > 1', async () => {
    const artist = makeArtist();
    const discussions = [makeDiscussion({ postCount: 5 })];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText(/5 posts/)).toBeInTheDocument();
    });
  });

  // 15
  test("shows loading indicator while discussions are loading", async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return new Promise(() => {});
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("Loading discussions...")).toBeInTheDocument();
    });
  });

  // 40
  test('developer control "Loading State" forces loading UI', async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => screen.getByText(artist.name));

    fireEvent.click(screen.getByRole("button", { name: "Loading State" }));

    expect(screen.getByText("Loading artist...")).toBeInTheDocument();
    expect(screen.queryByText(artist.name)).not.toBeInTheDocument();
  });

  // 41
  test('developer control "Not Found State" forces not-found UI', async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => screen.getByText(artist.name));

    fireEvent.click(screen.getByRole("button", { name: "Not Found State" }));

    expect(screen.getByText("Artist not found.")).toBeInTheDocument();
    expect(screen.queryByText(artist.name)).not.toBeInTheDocument();
  });

  // 42
  test('developer control "Live" restores actual query-driven UI', async () => {
    const artist = makeArtist();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => screen.getByText(artist.name));

    fireEvent.click(screen.getByRole("button", { name: "Loading State" }));
    expect(screen.getByText("Loading artist...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Live" }));

    expect(screen.queryByText("Loading artist...")).not.toBeInTheDocument();
    expect(screen.getByText(artist.name)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Inline queryFn (artist) — tests 20–23
// ---------------------------------------------------------------------------

describe("Inline queryFn (artist)", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  function renderNoId() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArtistPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  // 20
  test("artist query is disabled when id is undefined", async () => {
    renderNoId();
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 21
  test("artist queryFn fetches correct URL with route id", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    renderPage("art-42");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/artists/art-42");
    });
  });

  // 22
  test("artist queryFn throws on non-OK response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("Artist not found.")).toBeInTheDocument();
    });
  });

  // 23
  test("artist queryFn parses and returns JSON on success", async () => {
    const artist = makeArtist({ id: "1", name: "Test" });
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Test" })).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Inline queryFn (discussions) — tests 24–28
// ---------------------------------------------------------------------------

describe("Inline queryFn (discussions)", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  function renderNoId() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArtistPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  // 24
  test("discussions query is disabled when id is undefined", async () => {
    renderNoId();
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 25
  test("discussions queryFn fetches correct URL with route id", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    renderPage("art-42");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/artists/art-42/discussions");
    });
  });

  // 26
  test("discussions queryFn throws on non-OK response", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("No discussions yet. Trigger LLM activity to generate some!")).toBeInTheDocument();
    });
  });

  // 27
  test("discussions queryFn parses and returns JSON on success", async () => {
    const discussions = [makeDiscussion({ title: "Parsed Discussion" })];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    renderPage("1");
    await waitFor(() => {
      expect(screen.getByText("Parsed Discussion")).toBeInTheDocument();
    });
  });

  // 28
  test("discussions query has 8-second refetchInterval for polling", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/discussions")) {
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    renderPage("1");

    await act(async () => { await Promise.resolve(); });

    const callsBefore = fetchMock.mock.calls.filter(([url]: [string]) =>
      url.includes("/discussions")
    ).length;

    act(() => { jest.advanceTimersByTime(8000); });
    await act(async () => { await Promise.resolve(); });

    const callsAfter = fetchMock.mock.calls.filter(([url]: [string]) =>
      url.includes("/discussions")
    ).length;

    expect(callsAfter).toBeGreaterThan(callsBefore);
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// handleTrigger — tests 29–36
// ---------------------------------------------------------------------------

describe("handleTrigger", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Load artist so the trigger button is visible, then mock /api/events separately.
  function mockPageLoad() {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events") return new Promise(() => {});
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
  }

  async function loadAndClickTrigger() {
    renderPage("1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /trigger llm activity/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /trigger llm activity/i }));
    // Flush microtasks so async handlers (catch/finally) run inside an act boundary.
    await act(async () => {});
  }

  // 29
  test("trigger button calls POST /api/events with correct payload", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: true, json: async () => ({ job_count: 4 }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "page_activation", artistId: "1" }),
      });
    });
  });

  // 30
  test("trigger button shows success toast with job count on 200 response", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: true, json: async () => ({ job_count: 3 }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("3 LLM comment job(s)"));
    });
  });

  // 31
  test("trigger button shows error toast with server message on non-OK response", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: "Server error" }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server error");
    });
  });

  // 32
  test("trigger button shows fallback error toast when response has no error field", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to trigger LLM activity");
    });
  });

  // 33
  test("trigger button shows network error toast on fetch failure", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events") return Promise.reject(new Error("Network failure"));
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error — could not reach the server");
    });
  });

  // 34
  test("trigger button is disabled while request is in flight", async () => {
    mockPageLoad();
    await loadAndClickTrigger();
    expect(screen.getByRole("button", { name: /trigger llm activity/i })).toBeDisabled();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  // 35
  test("trigger button re-enables after request completes (success)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: true, json: async () => ({ job_count: 2 }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /trigger llm activity/i })).not.toBeDisabled();
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
  });

  // 36
  test("trigger button re-enables after request completes (error)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events") return Promise.reject(new Error("Network failure"));
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /trigger llm activity/i })).not.toBeDisabled();
    });
  });

  // 37
  test("setTimeout schedules refetchDiscussions 5s after successful trigger", async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: true, json: async () => ({ job_count: 2 }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

    const timeoutCall = setTimeoutSpy.mock.calls.find((args) => args[1] === 5000);
    const callback = timeoutCall![0] as () => void;

    const discCallsBefore = fetchMock.mock.calls.filter(([url]: [string]) =>
      url.includes("/discussions")
    ).length;

    await act(async () => { callback(); });

    const discCallsAfter = fetchMock.mock.calls.filter(([url]: [string]) =>
      url.includes("/discussions")
    ).length;

    expect(discCallsAfter).toBeGreaterThan(discCallsBefore);
    setTimeoutSpy.mockRestore();
  });

  // 38
  test("setTimeout is NOT called on failed trigger response", async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events")
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: "Server error" }) });
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 5000);
    setTimeoutSpy.mockRestore();
  });

  // 39
  test("setTimeout is NOT called on network error", async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/events") return Promise.reject(new Error("Network failure"));
      if (url.includes("/discussions"))
        return Promise.resolve({ ok: true, json: async () => ({ discussions: [], total: 0 }) });
      return Promise.resolve({ ok: true, json: async () => ({ artist: makeArtist() }) });
    });
    await loadAndClickTrigger();
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 5000);
    setTimeoutSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// formatTime — tests 1–7
// ---------------------------------------------------------------------------

describe("formatTime", () => {
  // 1
  test('returns "just now" for a timestamp less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
    expect(formatTime(thirtySecondsAgo)).toBe("just now");
  });

  // 2
  test('returns minutes-ago format for timestamps under 1 hour', () => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(formatTime(fifteenMinutesAgo)).toBe("15m ago");
  });

  // 3
  test('returns hours-ago format for timestamps under 24 hours', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60_000).toISOString();
    expect(formatTime(fiveHoursAgo)).toBe("5h ago");
  });

  // 4
  test('returns days-ago format for timestamps 24+ hours old', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
    expect(formatTime(threeDaysAgo)).toBe("3d ago");
  });

  // 5
  test('returns "1m ago" at exactly 1 minute boundary', () => {
    const exactlyOneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    expect(formatTime(exactlyOneMinuteAgo)).toBe("1m ago");
  });

  // 6
  test('returns "1h ago" at exactly 60 minutes boundary', () => {
    const exactlySixtyMinutesAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(formatTime(exactlySixtyMinutesAgo)).toBe("1h ago");
  });

  // 7
  test('returns "1d ago" at exactly 24 hours boundary', () => {
    const exactlyTwentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    expect(formatTime(exactlyTwentyFourHoursAgo)).toBe("1d ago");
  });
});
