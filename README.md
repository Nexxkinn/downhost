<h1 align="center">
  <br>
  <img src="webui/static/icon.png" alt="DownHost">
  
  <br>
  <b>DownHost</b>
  <br>
  <sub-title style="font-size:18px;">Gallery archive and reader</sub-title>
  <br>
</h1>

### Installation
- install [deno](https://deno.land/#installation)
- prepare config.json and (optional) auth.json file.
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
    "webui_dir":"",
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

### Todo
- [x] Gallery page/API
- [x] Fancy directory listing
- [x] Metadata support
- [x] Reader client
- [x] Restore download list
- [x] Stop/Pause download list
- [?] Compactibilty with other apps

### Special Thanks
- [feather icons](https://github.com/feathericons/feather)