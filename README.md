<h1 align="center">
  <br>
  <img src="client/static/icon.png" alt="DownHost">
  
  <br>
  <b>DownHost</b>
  <br>
  <sub-title style="font-size:18px;">Gallery Scrapper & Reader</sub-title>
  <br>
</h1>

### Installation
```bash
deno run --allow-read --allow-write --allow-net mod.ts
```

### Warning
```
The app is prone to API Injection attack as the app has yet to implement input sanitazion. Do not expose the app to public network at all cost.

USE IT WITH YOUR OWN RISK!!!
```

### Todo
- Fancy directory listing
- Reader client
- Rewrite download pipeline
- add more services
- add webtorrent (?)