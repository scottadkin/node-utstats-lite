function bContainProtocol(message){

    const reg = /^(http|https|ftp|unreal):\/\/.+$/i;

    return reg.test(message);
}

function urlReplacer(match, p1,  offset, string, groups){;

    p1 = (bContainProtocol(p1)) ? p1 : `https://${p1}`;

    return `<a class="welcome-message-link" href="${p1}">${p1}</a>`;
}

function urlNamedReplacer(match, p1, p2,  offset, string, groups){

    p1 = (bContainProtocol(p1)) ? p1 : `https://${p1}`;

    return `<a class="welcome-message-link" href="${p1}">${p2}</a>`;
}


export default function BBParser(input){

    const patterns = [
        [/</ig, "&lt;"],
        [/>/ig, "&gt;"],
        [/"/ig, "&quot;"],
        [/\n/ig, "<br/>"],
        [/\[b\](.+?)\[\/b\]/ig, "<b>$1</b>"],
        [/\[url\](.+?)\[\/url\]/ig, urlReplacer],
        [/\[url=(.+?)\](.+?)\[\/url\]/ig, urlNamedReplacer],
    ];


    for(let i = 0; i < patterns.length; i++){

        const [find, replace] = patterns[i];

        input = input.replace(find, replace);
    }
    
    return input;
}