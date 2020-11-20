import { loadConfig } from "../config.ts";
import { zipDir } from './mod.ts';
import { join } from "../_deps.ts";

const config = await loadConfig()
const dir = await zipDir(join(config.temp_dir,'test'));
dir.writeZip(join(config.catalog_dir,'test.zip'));