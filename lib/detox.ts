const magic = "mlpxghojvtusbkrzfdaqye69n1c3420we3d"

const ten = new TextEncoder();
const tde = new TextDecoder();

export function de(text: string) {
    if(!text) return String();
    const input = text.endsWith('...') ? text.substr(0,text.length-3) : text;
    const length = input.length

    let bits = 0
    let value = 0

    let index = 0
    let output = new Uint8Array((length * 5 / 8) | 0)

    for (var i = 0; i < length; i++) {
        value = (value << 5) | magic.indexOf(input[i]);
        bits += 5

        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255
            bits -= 8
        }
    }

    return tde.decode(output);
}

export function en(text: string,dot=true) {
    const array = new Uint8Array(ten.encode(text));
    const copy = new Uint8Array(array);
    const len = array.byteLength;
    
    let bits = 0
    let value = 0
    let output = ''

    for (var i = 0; i < len; i++) {
        value = (value << 8) | copy[i]
        bits += 8

        while (bits >= 5) {
            output += magic[(value >>> (bits - 5)) & 31]
            bits -= 5
        }
    }

    if (bits > 0) {
        output += magic[(value << (5 - bits)) & 31]
    }

    output += dot ? '...' : '';

    return output
}