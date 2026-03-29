def test_get_genres(client):
    """Test that /api/genres returns the correct genres from seed."""
    response = client.get("/api/genres")
    assert response.status_code == 200
    data = response.get_json()
    assert "genres" in data
    assert sorted(data["genres"]) == ["Pop", "Rock"]

def test_get_artists_empty(client):
    """Test /api/artists returns empty list if no artists are seeded."""
    response = client.get("/api/artists")
    assert response.status_code == 200
    data = response.get_json()
    assert data["artists"] == []
    assert data["total"] == 0
