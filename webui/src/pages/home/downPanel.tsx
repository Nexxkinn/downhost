import { For, Show } from 'solid-js';
import { del_icon, inf_icon } from "./icons";

export function DownPanel({ visible = false, list }) {
    return <Show when={visible}>
        <div class="down-list" hidden>
            <For each={list.down}>{({ id, title, size, status, size_down }, i) =>
                <fast-card>
                    <div style="grid-area: name;">{title}</div>
                    <div style="grid-area: opt;">
                        <fast-button title="remove from the list" appearance="neutral">
                            {del_icon}
                        </fast-button>
                    </div>
                    <fast-progress
                        style="grid-area: prog;"
                        role="progressbar"
                        max={size}
                        value={size_down ? (size_down / size) * 100 : null}>
                    </fast-progress>
                </fast-card>
            }
            </For>
        </div>
    </Show>
}
