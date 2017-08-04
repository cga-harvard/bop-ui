/*eslint max-len: [2,100]*/

export default function HeightModule(window){

    const itemHeight = 90;
    const rightSideBarWidth = 4;
    const bottomHeight = 4;

    return {
        itemHeight,
        rightSideBarWidth,
        bottomHeight,
        otherHeights,
        sideBarWidth,
        topPanelHeight,
        documentHeight,
        availableHeight,
        getNumberofItems
    };

    function documentHeight() {
        const D = window.document;
        return Math.max(D.body.offsetHeight, D.documentElement.offsetHeight,
            D.body.clientHeight, D.documentElement.clientHeight);
    }

    function topPanelHeight() {
        if (window.innerWidth < 1200) {
            return 4;
        }
        return 102;
    }

    function otherHeights() {
        if (window.innerWidth < 1200) {
            return 560;
        }
        return 350;
    }

    function sideBarWidth() {
        if (window.innerWidth < 800) {
            return 4;
        }
        return 400;
    }

    function availableHeight() {
        return documentHeight() - otherHeights();
    }

    function getNumberofItems() {
        const height = availableHeight();
        if (height > 0) {
            return Math.round(height / itemHeight);
        }
        return 10;
    }
}
