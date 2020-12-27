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
- run command
```bash
deno run --allow-read --allow-write --allow-net mod.ts
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
- most cases is still under happy path ( except download pipeline )
- some depedencies is still waiting to be fixed:
   - `littlezip` needs to add a feature to recover file from terminated jobs to prevent file duplications

### Todo
- Fancy directory listing
- Reader client
- Restore download list
- Stop/Pause download list

### Special Thanks
- [feather icons](https://github.com/feathericons/feather)