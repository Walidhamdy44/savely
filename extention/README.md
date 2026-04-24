# Savely

A Chrome extension to scrape and export your saved content from LinkedIn and YouTube.

## Features

- **Multi-platform support**: Works with LinkedIn Saved Posts and YouTube Playlists
- **Auto-scroll**: Automatically loads all content by scrolling
- **Multiple export formats**: JSON and CSV
- **Clean UI**: Modern, responsive design with dark mode support
- **Preview data**: See scraped data before downloading

## Supported Pages

| Platform | Page         | URL                                            |
| -------- | ------------ | ---------------------------------------------- |
| LinkedIn | Saved Posts  | https://www.linkedin.com/my-items/saved-posts/ |
| YouTube  | Watch Later  | https://www.youtube.com/playlist?list=WL       |
| YouTube  | Any Playlist | https://www.youtube.com/playlist?list=*        |

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `savely` folder

## Usage

1. Navigate to a supported page (LinkedIn Saved Posts or YouTube Playlist)
2. Click the Savely extension icon
3. Click "Scrape Current Page"
4. Wait for scraping to complete
5. Preview the data in the table
6. Select format (JSON/CSV) and click Download

## Exported Data

### LinkedIn Saved Posts

```json
{
  "authorName": "John Doe",
  "authorProfileURL": "https://www.linkedin.com/in/johndoe",
  "authorJobTitle": "Software Engineer",
  "postURL": "https://www.linkedin.com/feed/update/...",
  "postContent": "Post text content...",
  "postImage": "https://media.licdn.com/...",
  "timeSincePosted": "2d",
  "scrapedAt": "2024-01-15T10:30:00.000Z"
}
```

### YouTube Playlist

```json
{
  "videoTitle": "Video Title",
  "videoURL": "https://www.youtube.com/watch?v=...",
  "videoThumbnail": "https://i.ytimg.com/vi/.../hqdefault.jpg",
  "channelName": "Channel Name",
  "channelURL": "https://www.youtube.com/@channel",
  "duration": "10:30",
  "viewCount": "1.2M views",
  "uploadDate": "2 weeks ago",
  "playlistTitle": "Playlist Name",
  "playlistURL": "https://www.youtube.com/playlist?list=...",
  "scrapedAt": "2024-01-15T10:30:00.000Z"
}
```

## Privacy

- All data stays in your browser
- No external servers or tracking
- Only runs on supported pages

## License

MIT License
