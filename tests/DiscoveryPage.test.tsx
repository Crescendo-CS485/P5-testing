import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import DiscoveryPage, { buildParams } from "../frontend/src/app/pages/DiscoveryPage";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

function makeArtist(overrides = {}) {
  return {
    id: "1",
    name: "Test Artist",
    image: "https://example.com/img.jpg",
    bio: "A test artist bio",
    activityScore: 7.5,
    discussionCount: 10,
    latestThread: { id: "disc-1", title: "Test thread", timestamp: "2h ago" },
    genres: ["Rock"],
    ...overrides,
  };
}

function makeResponse(artists: object[], total = artists.length, page = 1, pages = 1) {
  return { artists, total, page, pages };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// buildParams
// ---------------------------------------------------------------------------

describe("buildParams", () => {
  test("converts simple key-value pairs into query string", () => {
    expect(buildParams({ sort: "activity", page: 1 })).toBe("sort=activity&page=1");
  });

  test("skips undefined values", () => {
    expect(buildParams({ sort: "activity", genre: undefined })).toBe("sort=activity");
  });

  test("skips null values", () => {
    expect(buildParams({ sort: null, page: 1 })).toBe("page=1");
  });

  test("skips false values", () => {
    expect(buildParams({ active_discussions: false, page: 1 })).toBe("page=1");
  });

  test("skips empty string values", () => {
    expect(buildParams({ time_range: "", sort: "recent" })).toBe("sort=recent");
  });

  test("appends array values as repeated keys", () => {
    expect(buildParams({ genre: ["rock", "jazz"] })).toBe("genre=rock&genre=jazz");
  });

  test("handles empty object", () => {
    expect(buildParams({})).toBe("");
  });

  test("handles mixed types with some skippable", () => {
    expect(buildParams({ a: "x", b: null, c: false, d: ["1", "2"], e: undefined })).toBe("a=x&d=1&d=2");
  });

  test("converts numeric values to strings", () => {
    expect(buildParams({ page: 3, per_page: 12 })).toBe("page=3&per_page=12");
  });
});

// ---------------------------------------------------------------------------
// DiscoveryPage component — tests 10–20
// ---------------------------------------------------------------------------

describe("DiscoveryPage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    mockNavigate.mockClear();
  });

  // 10
  test("renders page header with artist count plural", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 42),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/42 artists/)).toBeInTheDocument();
    });
  });

  // 11
  test("renders page header with artist count singular", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/1 artist\b/)).toBeInTheDocument();
      expect(screen.queryByText(/1 artists/)).not.toBeInTheDocument();
    });
  });

  // 12
  test("renders 12 skeleton cards during loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const skeletonGrid = Array.from(container.querySelectorAll<HTMLElement>(".grid")).find(
      (g) => g.children.length === 12
    );
    expect(skeletonGrid).toBeTruthy();
    expect(skeletonGrid!.children).toHaveLength(12);
  });

  // 13
  test("renders loading spinner text during loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Loading artist data...")).toBeInTheDocument();
  });

  // 14
  test("renders error state with retry button on fetch failure", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("API Connection Error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry connection/i })).toBeInTheDocument();
    });
  });

  // 15
  test("retry button on error state refetches data", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /retry connection/i }));
    fireEvent.click(screen.getByRole("button", { name: /retry connection/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // 16
  test("renders empty state when no artists match filters", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([], 0, 1, 0),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("No Content Found")).toBeInTheDocument();
    });
  });

  // 17
  test("empty state action calls handleReset", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    // Force empty state via dev controls
    fireEvent.click(screen.getByRole("button", { name: "Empty State" }));
    expect(screen.getByText("No Content Found")).toBeInTheDocument();

    // Click Reset Filters in EmptyState — calls handleReset which sets devState = null
    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    await waitFor(() => {
      expect(screen.queryByText("No Content Found")).not.toBeInTheDocument();
    });
  });

  // 18
  test("renders artist cards in a grid on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        makeResponse([
          makeArtist({ id: "1", name: "Artist 1" }),
          makeArtist({ id: "2", name: "Artist 2" }),
          makeArtist({ id: "3", name: "Artist 3" }),
        ], 3),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  // 19
  test("passes isActiveFilter prop to ArtistCard reflecting toggle state", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        makeResponse([makeArtist({ id: "1", name: "Hot Artist", activityScore: 9.0 })], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Hot Artist"));

    // Active badge should not appear before toggle (isActiveFilter = false)
    expect(screen.queryByText("Active")).not.toBeInTheDocument();

    // Toggle active discussions switch
    fireEvent.click(screen.getByRole("switch"));

    // Active badge now visible: isActiveFilter = true and activityScore >= 8.5
    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  // 20
  test("sort dropdown defaults to activity", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Activity Score")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Helpers shared by tests 21–30
  // ---------------------------------------------------------------------------

  function mockPaginated() {
    const artists = Array.from({ length: 12 }, (_, i) =>
      makeArtist({ id: String(i + 1), name: `Artist ${i + 1}` })
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ artists, total: 60, page: 1, pages: 5 }),
    });
  }

  function lastFetchUrl(): string {
    const calls = fetchMock.mock.calls;
    return (calls[calls.length - 1] as [string])[0];
  }

  async function goToPage(n: number) {
    await waitFor(() => screen.getByRole("button", { name: `Page ${n}` }));
    fireEvent.click(screen.getByRole("button", { name: `Page ${n}` }));
    await waitFor(() => expect(lastFetchUrl()).toContain(`page=${n}`));
  }

  // ---------------------------------------------------------------------------
  // onActiveDiscussionsChange — tests 21–24
  // ---------------------------------------------------------------------------

  // 21
  test("toggling active discussions on resets page to 1", async () => {
    mockPaginated();
    renderPage();
    await goToPage(3);

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(lastFetchUrl()).toContain("active_discussions=true");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 22
  test("toggling active discussions off resets page to 1", async () => {
    mockPaginated();
    renderPage();

    // Turn on active discussions first (page stays at 1)
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(lastFetchUrl()).toContain("active_discussions=true"));

    // Navigate to page 2
    await goToPage(2);

    // Toggle off
    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(lastFetchUrl()).not.toContain("active_discussions");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 23
  test("active discussions filter is included in query params when true", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getByRole("switch"));

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(lastFetchUrl()).toContain("active_discussions=true")
    );
  });

  // 24
  test("active discussions filter is excluded from query params when false", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => fetchMock.mock.calls.length >= 1);

    expect(lastFetchUrl()).not.toContain("active_discussions");
  });

  // ---------------------------------------------------------------------------
  // onGenresChange — tests 25–27
  // ---------------------------------------------------------------------------

  // 25
  test("changing genres updates selectedGenres and resets page to 1", async () => {
    mockPaginated();
    renderPage();
    await goToPage(4);

    fireEvent.click(screen.getByRole("button", { name: "Rock" }));

    await waitFor(() => {
      expect(lastFetchUrl()).toContain("genre=Rock");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 26
  test("clearing genres resets selectedGenres to empty and page to 1", async () => {
    mockPaginated();
    renderPage();

    // Select Rock first
    await waitFor(() => screen.getByRole("button", { name: "Rock" }));
    fireEvent.click(screen.getByRole("button", { name: "Rock" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("genre=Rock"));

    // Navigate to page 2
    await goToPage(2);

    // Deselect Rock (selectedGenres → [])
    fireEvent.click(screen.getByRole("button", { name: "Rock" }));

    await waitFor(() => {
      expect(lastFetchUrl()).not.toContain("genre=");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 27
  test("selected genres are included in query params as repeated keys", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: "Rock" }));

    fireEvent.click(screen.getByRole("button", { name: "Rock" }));
    fireEvent.click(screen.getByRole("button", { name: "Jazz" }));

    await waitFor(() => {
      expect(lastFetchUrl()).toContain("genre=Rock");
      expect(lastFetchUrl()).toContain("genre=Jazz");
    });
  });

  // ---------------------------------------------------------------------------
  // onValueChange (sort) — tests 28–30
  // ---------------------------------------------------------------------------

  // 28
  test("changing sort to recent updates sort and resets page to 1", async () => {
    mockPaginated();
    renderPage();
    await goToPage(3);

    const [sortCombobox] = screen.getAllByRole("combobox");
    fireEvent.click(sortCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Most Recent" }));

    await waitFor(() => {
      expect(lastFetchUrl()).toContain("sort=recent");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 29
  test("changing sort to activity updates sort and resets page to 1", async () => {
    mockPaginated();
    renderPage();

    // Switch to recent first
    await waitFor(() => screen.getAllByRole("combobox").length > 0);
    const [sortCombobox] = screen.getAllByRole("combobox");
    fireEvent.click(sortCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Most Recent" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("sort=recent"));

    // Navigate to page 2
    await goToPage(2);

    // Switch back to activity
    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(screen.getByRole("option", { name: "Activity Score" }));

    await waitFor(() => {
      expect(lastFetchUrl()).toContain("sort=activity");
      expect(lastFetchUrl()).toContain("page=1");
    });
  });

  // 30
  test("sort value is included in query params", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getAllByRole("combobox").length > 0);

    const [sortCombobox] = screen.getAllByRole("combobox");
    fireEvent.click(sortCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Most Recent" }));

    await waitFor(() => expect(lastFetchUrl()).toContain("sort=recent"));
  });

  // ---------------------------------------------------------------------------
  // onTimeRangeChange — tests 31–32
  // ---------------------------------------------------------------------------

  // 31 — selectedTimeRange = "all" → time_range excluded from query
  test("time range 'all' is excluded from query params", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => fetchMock.mock.calls.length >= 1);

    expect(lastFetchUrl()).not.toContain("time_range");
  });

  // 32 — selectedTimeRange non-"all" → time_range included in query
  // (spec input: "week"; nearest available option is "Last 7 Days" → "7d")
  test("time range non-'all' is included in query params", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getAllByRole("combobox").length >= 2);

    const timeRangeCombobox = screen.getAllByRole("combobox")[1];
    fireEvent.click(timeRangeCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Last 7 Days" }));

    await waitFor(() => expect(lastFetchUrl()).toContain("time_range=7d"));
  });

  // ---------------------------------------------------------------------------
  // handleReset — tests 33–34
  // ---------------------------------------------------------------------------

  // 33 — handleReset clears all filters, sort, page, and devState
  test("handleReset clears all filters, sort, page, and devState", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getAllByRole("combobox").length >= 2);

    // Set non-default values for every filter
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(lastFetchUrl()).toContain("active_discussions=true"));
    fireEvent.click(screen.getByRole("button", { name: "Rock" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("genre=Rock"));
    const timeRangeCombobox = screen.getAllByRole("combobox")[1];
    fireEvent.click(timeRangeCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Last 7 Days" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("time_range=7d"));
    await goToPage(3);

    // Trigger handleReset via Reset All button in FilterBar
    fireEvent.click(screen.getByRole("button", { name: "Reset All" }));

    await waitFor(() => {
      const url = lastFetchUrl();
      expect(url).not.toContain("active_discussions");
      expect(url).not.toContain("genre=");
      expect(url).not.toContain("time_range");
      expect(url).toContain("sort=activity");
      expect(url).toContain("page=1");
    });
  });

  // 34 — handleReset is passed to FilterBar as onReset prop
  // Proof: clicking FilterBar's Reset All also resets devState (only handleReset does this)
  test("handleReset is passed to FilterBar as onReset prop", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    // Force devState to override
    fireEvent.click(screen.getByRole("button", { name: "Error State" }));
    expect(screen.getByText("API Connection Error")).toBeInTheDocument();

    // Activate a filter so FilterBar shows its Reset All button
    fireEvent.click(screen.getByRole("switch"));

    // FilterBar's onReset IS handleReset — must also clear devState = null
    fireEvent.click(screen.getByRole("button", { name: "Reset All" }));

    await waitFor(() => {
      expect(screen.queryByText("API Connection Error")).not.toBeInTheDocument();
      expect(screen.getByText("Test Artist")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Pagination UI — tests 35–45
  // ---------------------------------------------------------------------------

  // 35 — pagination shows correct page info text (page 2 of 5, showing 13–24 of 60)
  test("pagination shows correct page info text", async () => {
    mockPaginated();
    renderPage();
    await goToPage(2);
    await waitFor(() => screen.getByText("Page 2 of 5"));

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("Showing 13–24 of 60")).toBeInTheDocument();
  });

  // 36 — Previous button is disabled on page 1
  test("Previous button is disabled on page 1", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: "Previous page" }));

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });

  // 37 — Next button is disabled on last page (page = totalPages)
  test("Next button is disabled on last page", async () => {
    mockPaginated();
    renderPage();
    await goToPage(5);
    await waitFor(() => screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  // 38 — clicking Next from page 2 increments page to 3
  test("clicking Next increments page by 1", async () => {
    mockPaginated();
    renderPage();
    await goToPage(2);
    await waitFor(() => screen.getByRole("button", { name: "Next page" }));

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => expect(lastFetchUrl()).toContain("page=3"));
  });

  // 39 — clicking Previous from page 3 decrements page to 2
  test("clicking Previous decrements page by 1", async () => {
    mockPaginated();
    renderPage();
    await goToPage(3);
    await waitFor(() => screen.getByRole("button", { name: "Previous page" }));

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));

    await waitFor(() => expect(lastFetchUrl()).toContain("page=2"));
  });

  // 40 — clicking a page number button sets page directly
  test("clicking a page number button sets page directly", async () => {
    mockPaginated();
    renderPage();
    await goToPage(4);

    await waitFor(() => expect(lastFetchUrl()).toContain("page=4"));
  });

  // 41 — current page button has aria-current="page"; others do not
  test("current page button has aria-current='page'", async () => {
    mockPaginated();
    renderPage();
    await goToPage(2);
    await waitFor(() => screen.getByRole("button", { name: "Page 2" }));

    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveAttribute("aria-current", "page");
  });

  // 42 — pagination nav is hidden when only 1 page exists
  test("pagination is hidden when only 1 page exists", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1, 1, 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  // Helper for 10-page window scenarios (tests 43–45)
  function mockTenPages() {
    const artists = Array.from({ length: 12 }, (_, i) =>
      makeArtist({ id: String(i + 1), name: `Artist ${i + 1}` })
    );
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ artists, total: 120, page: 1, pages: 10 }),
    });
  }

  // 43 — page window centers around current page for middle pages
  // totalPages=10, page=5 → window shows 3, 4, 5, 6, 7
  test("page window centers around current page for middle pages", async () => {
    mockTenPages();
    renderPage();
    await goToPage(5);
    await waitFor(() => screen.getByRole("button", { name: "Page 3" }));

    for (const p of [3, 4, 5, 6, 7]) {
      expect(screen.getByRole("button", { name: `Page ${p}` })).toBeInTheDocument();
    }
    for (const p of [1, 2, 8, 9, 10]) {
      expect(screen.queryByRole("button", { name: `Page ${p}` })).not.toBeInTheDocument();
    }
  });

  // 44 — page window starts at 1 for early pages
  // totalPages=10, page=2 → window shows 1, 2, 3, 4, 5
  test("page window starts at 1 for early pages", async () => {
    mockTenPages();
    renderPage();
    await goToPage(2);
    await waitFor(() => screen.getByRole("button", { name: "Page 1" }));

    for (const p of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole("button", { name: `Page ${p}` })).toBeInTheDocument();
    }
    for (const p of [6, 7, 8, 9, 10]) {
      expect(screen.queryByRole("button", { name: `Page ${p}` })).not.toBeInTheDocument();
    }
  });

  // 45 — page window ends at totalPages for late pages
  // totalPages=10, page=9 → window shows 6, 7, 8, 9, 10
  test("page window ends at totalPages for late pages", async () => {
    mockTenPages();
    renderPage();
    // Step through the window: 1→5 (shows 1-5) → 5→7 (shows 5-9) → 7→9 (shows 6-10)
    await goToPage(5);
    await waitFor(() => screen.getByRole("button", { name: "Page 7" }));
    await goToPage(7);
    await waitFor(() => screen.getByRole("button", { name: "Page 9" }));
    await goToPage(9);
    await waitFor(() => screen.getByRole("button", { name: "Page 6" }));

    for (const p of [6, 7, 8, 9, 10]) {
      expect(screen.getByRole("button", { name: `Page ${p}` })).toBeInTheDocument();
    }
    for (const p of [1, 2, 3, 4, 5]) {
      expect(screen.queryByRole("button", { name: `Page ${p}` })).not.toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Developer Controls — tests 46–49
  // ---------------------------------------------------------------------------

  // 46 — "Loading State" forces skeleton UI regardless of actual query state
  test("developer control 'Loading State' forces loading UI", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    fireEvent.click(screen.getByRole("button", { name: "Loading State" }));

    expect(screen.getByText("Loading artist data...")).toBeInTheDocument();
    expect(screen.queryByText("Test Artist")).not.toBeInTheDocument();
  });

  // 47 — "Error State" forces error UI regardless of actual query state
  test("developer control 'Error State' forces error UI", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    fireEvent.click(screen.getByRole("button", { name: "Error State" }));

    expect(screen.getByText("API Connection Error")).toBeInTheDocument();
    expect(screen.queryByText("Test Artist")).not.toBeInTheDocument();
  });

  // 48 — "Empty State" forces empty UI regardless of actual query state
  test("developer control 'Empty State' forces empty UI", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    fireEvent.click(screen.getByRole("button", { name: "Empty State" }));

    expect(screen.getByText("No Content Found")).toBeInTheDocument();
    expect(screen.queryByText("Test Artist")).not.toBeInTheDocument();
  });

  // 49 — "Live (Success)" restores component to real query data
  test("developer control 'Live (Success)' restores real data", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist()], 1),
    });
    renderPage();
    await waitFor(() => screen.getByText("Test Artist"));

    fireEvent.click(screen.getByRole("button", { name: "Error State" }));
    expect(screen.getByText("API Connection Error")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Live (Success)" }));

    expect(screen.queryByText("API Connection Error")).not.toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Go to Artist button — tests 50–51
  // ---------------------------------------------------------------------------

  // 50 — "Go to Artist" button navigates to first artist's page
  test("'Go to Artist' button navigates to first artist's page", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([makeArtist({ id: "art-1" })], 1),
    });
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /go to artist/i }));

    fireEvent.click(screen.getByRole("button", { name: /go to artist/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/artists/art-1");
  });

  // 51 — "Go to Artist" button is hidden when API returns empty artists array
  test("'Go to Artist' button is hidden when no artists loaded", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeResponse([], 0, 1, 0),
    });
    renderPage();
    await waitFor(() => screen.getByText("No Content Found"));

    expect(screen.queryByRole("button", { name: /go to artist/i })).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Full query string — test 52
  // ---------------------------------------------------------------------------

  // 52 — full query string includes all active filters simultaneously (including page=2)
  test("full query string includes all active filters simultaneously", async () => {
    mockPaginated();
    renderPage();
    await waitFor(() => screen.getAllByRole("combobox").length >= 2);

    // active discussions
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(lastFetchUrl()).toContain("active_discussions=true"));

    // genre
    fireEvent.click(screen.getByRole("button", { name: "Rock" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("genre=Rock"));

    // time range ("week" in spec → nearest option: "Last 7 Days" → "7d")
    const timeRangeCombobox = screen.getAllByRole("combobox")[1];
    fireEvent.click(timeRangeCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Last 7 Days" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("time_range=7d"));

    // sort
    const [sortCombobox] = screen.getAllByRole("combobox");
    fireEvent.click(sortCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Most Recent" }));
    await waitFor(() => expect(lastFetchUrl()).toContain("sort=recent"));

    // navigate to page 2
    await waitFor(() => screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => {
      const url = lastFetchUrl();
      expect(url).toContain("active_discussions=true");
      expect(url).toContain("genre=Rock");
      expect(url).toContain("time_range=7d");
      expect(url).toContain("sort=recent");
      expect(url).toContain("page=2");
      expect(url).toContain("per_page=12");
    });
  });
});
