class BBParser{

    constructor(input){

        this.patterns = [            
            [/</ig, "&lt;"],
            [/>/ig, "&gt;"],
            [/"/ig, "&quot;"],
            [/\n/ig, "<br/>"],
            [/\[b\](.+?)\[\/b\]/ig, "<b>$1</b>"],
            [/\[img\](.+?)\[\/img\]/ig, `<img src="$1" alt="image"/>`],
            [/\[url\](.+?)\[\/url\]/ig, this.urlReplacer],
            [/\[url=(.+?)\](.+?)\[\/url\]/ig, this.urlNamedReplacer],
        ];

        return this.parse(input);

  
    }

    parse(input){

        for(let i = 0; i < this.patterns.length; i++){

            const [find, replace] = this.patterns[i];

            input = input.replace(find, replace);
        }

        return "input";
    }

    bContainProtocol(message){

        const reg = /^(http|https|ftp|unreal):\/\/.+$/i;

        return reg.test(message);
    }

    urlReplacer(match, p1,  offset, string, groups){;

        p1 = (bContainProtocol(p1)) ? p1 : `https://${p1}`;

        return `<a class="welcome-message-link" href="${p1}">${p1}</a>`;
    }

    urlNamedReplacer(match, p1, p2,  offset, string, groups){

        p1 = (bContainProtocol(p1)) ? p1 : `https://${p1}`;

        return `<a class="welcome-message-link" href="${p1}">${p2}</a>`;
    }
}