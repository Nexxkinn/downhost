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
- clone repo
- install deno
- prepare config and (optional) auth file.
- prepare web client folder `client` provided in the repo under your current working directory.
- run command
```bash
deno run --allow-read --allow-write --allow-net http://nexxkinn.gitlab.io/downhost/dev/mod.ts
```

### Config
```
// config.json
{
    "hostname":"localhost",
    "port":8080,
    "base_url": "",
    "catalog_dir":"",
    "temp_dir":"",
    "pass":""
}

// auth.json, optional for selected sites.
// check ./script/ for filename lists.
{
    "script_filename" :{
        "u":"username",
        "p":"password"
    }
}
```

### Warning
```
This app is under active development, and will prone
to breaking changes. 

The app is prone to  API Injection attack as the app 
has yet to implement input sanitazion. Do not expose
the app to public network at all cost.

USE IT WITH YOUR OWN RISK!!!
```

### Limitation
- prone to breaking changes in database
- no mechanism to resume paused/terminated jobs

### Todo
- Gallery page/API
- Fancy directory listing
- Metadata support
- Reader client
- Restore download list
- Stop/Pause download list
- Compactibilty with other apps

### Special Thanks
- [feather icons](https://github.com/feathericons/feather)