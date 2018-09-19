const reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

export default class EventSource {
    constructor(url, option = {}) {
        this.init = this.init.bind(this);
        this.close = this.close.bind(this);
        this.onError = this.onError.bind(this);
        this.addEventListener = this.addEventListener.bind(this);

        this.url = url;
        this.option = option;
        this.xhr = null;
        this.dicEvent = {
            message: () => { },
            open: () => { },
            error: () => { }
        };

        this.init(xhr => {
            this.xhr = xhr;
            this.dicEvent.open();
        });
    }

    addEventListener(event, func) {
        this.dicEvent[event] = func;
    }

    close() {
        this.xhr && this.xhr.abort && this.xhr.abort();
        this.xhr = null;
    }

    onError(error) {
        this.dicEvent.error(error);
    }

    init(onOpen) {
        const xhr = new XMLHttpRequest();
        let firstTime = true;

        xhr.open('GET', this.url, true);
        xhr.timeout = this.option.timeout || 50000;

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 3 || (xhr.readyState === 4 && xhr.status === 200)) {
                const responseText = xhr.responseText || '';
                const parts = responseText.split('\n');

                for (let line of parts) {
                    // line = line.replace(reTrim, '');
                    if (line.indexOf('data') === 0) {
                        this.dicEvent.message({ data: line.replace(/data:?\s*/, '') });
                    }
                }
                xhr._response = '';
            } else if (xhr.readyState === 2) {
                if (firstTime) {
                    onOpen && onOpen(xhr);
                    firstTime = false;
                }
            }
        };

        xhr.addEventListener('error', this.onError);

        this.option.headers && xhr.setRequestHeader('Authorization', this.option.headers.Authorization);
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.send();
    }
};
