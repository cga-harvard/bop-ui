/*eslint max-len: [2,100]*/
import geostats from 'geostats';

export default function heatmap(map) {
    return {
        createOrUpdateHeatMapLayer
    };

    function createOrUpdateHeatMapLayer(hmData){
        // Sad hardcode linear color gradient
        const sentimetGradient = ["hsl(400, 100%, 50%)", "hsl(399, 100%, 50%)",
            "hsl(396, 100%, 50%)", "hsl(393, 100%, 50%)", "hsl(390, 100%, 50%)",
            "hsl(385, 100%, 50%)", "hsl(380, 100%, 50%)", "hsl(360, 100%, 50%)",
            "hsl(340, 100%, 50%)", "hsl(300, 100%, 50%)",
            "hsl(260, 100%, 50%)", "hsl(200, 100%, 50%)"];
        const normalCountGradient = generateSigmoidColorGradient(330, 0);
        const existingHeatMapLayers = map.helpers.getLayersBy('name', 'HeatMapLayer');
        const transformInteractionLayer = map.helpers.getLayersBy('name',
                                                "TransformInteractionLayer")[0];
        hmData.heatmapRadius = 20;
        hmData.blur = 12;
        hmData.gradientArray = hmData.posSent ? sentimetGradient : normalCountGradient;

        const olVecSrc = createHeatMapSource(hmData);

        if (existingHeatMapLayers && existingHeatMapLayers.length > 0){
            const currHeatmapLayer = existingHeatMapLayers[0];
            // Update layer source
            const layerSrc = currHeatmapLayer.getSource();
            if (layerSrc){
                layerSrc.clear();
            }
            currHeatmapLayer.setSource(olVecSrc);
            currHeatmapLayer.setGradient(hmData.gradientArray);
        } else {
            const newHeatMapLayer = new ol.layer.Heatmap({
                name: 'HeatMapLayer',
                source: olVecSrc,
                radius: hmData.heatmapRadius,
                blur: hmData.blur,
                gradient: hmData.gradientArray
            });

            try {
                getMap().addLayer(newHeatMapLayer);
            } catch(err) {
                void 0;
            }

        }
    }

    /**
    * This function distributes the color gradients using the sigmoid function,
        distributing the colors to disperse the middle classes of the center
    * The HEX was replaced with the HSL color model, this allows to generate and
        array of colors that changes only the hue and maintains saturation and luminosity.
    **/
    function generateSigmoidColorGradient(maxHue=300, minHue=0) {
        const normalCountGradient = [];
        const NumberPartition = 12;
        const delta = (maxHue-minHue);
        for (let i = -NumberPartition/2; i < NumberPartition/2; i++) {
            let hue = sigmoid(i)*delta + minHue;
            let hsl = 'hsl(' + hue + ', 100%, 50%)';
            normalCountGradient.push(hsl);
        }
        return normalCountGradient.reverse();
    }

    function sigmoid(x) {
        return 1/(1 + Math.pow(Math.E, -x));
    }

    function getLayers(){
        return getMap().getLayers().getArray();
    }

    function getMap() {
        return map;
    }

    /*
     * @private
     */
    function createHeatMapSource(hmParams) {
        if (!hmParams.counts_ints2D) {
            return null;
        }
        const counts_ints2D = fillNullValueToEmptyArray(hmParams.counts_ints2D);
        const gridColumns = hmParams.columns;
        const gridRows = hmParams.rows;
        const minX = hmParams.minX;
        const minY = hmParams.minY;
        const maxX = hmParams.maxX;
        const maxY = hmParams.maxY;
        const hmProjection = hmParams.projection;
        const units = hmParams.posSent ? '%' : null;
        const dx = maxX - minX;
        const dy = maxY - minY;
        const sx = dx / gridColumns;
        const sy = dy / gridRows;
        const olFeatures = [];
        const classifications = getClassifications(hmParams);
        const minMaxValue = [0, classifications.length - 1];

        for (let i = 0 ; i < gridRows ; i++){
            for (let j = 0 ; j < gridColumns ; j++){
                let hmVal = counts_ints2D[counts_ints2D.length-i-1][j],
                    lon,
                    lat,
                    feat,
                    coords;

                if (hmVal && hmVal !== null){
                    lat = minY + i*sy + (0.5 * sy);
                    lon = minX + j*sx + (0.5 * sx);
                    coords = ol.proj.transform(
                        [lon, lat],
                        hmProjection,
                        map.getView().getProjection().getCode()
                    );

                    let classifiedValue = closestValue(classifications, hmVal);
                    let scaledValue = rescaleHeatmapValue(classifiedValue, minMaxValue);
                    feat = new ol.Feature({
                        name: hmVal,
                        units: units,
                        scaledValue: scaledValue,
                        geometry: new ol.geom.Point(coords),
                        opacity: 1,
                        weight: 1
                    });

                    feat.set('weight', scaledValue);
                    feat.set('origVal', hmVal);

                    olFeatures.push(feat);
                }
            }
        }

        const olVecSrc = new ol.source.Vector({
            features: olFeatures,
            useSpatialIndex: true
        });
        return olVecSrc;
    }

    function fillNullValueToEmptyArray(heatmap) {
        return heatmap.map(row => {
            return row === null ? [] : row;
        });
    }

    function getClassifications(hmParams) {
        const flattenCount = [];
        hmParams.counts_ints2D.forEach(row => {
            row = row === null ? [] : row;
            flattenCount.push(...row);
        });

        const series = new geostats(flattenCount);
        const gradientLength = hmParams.gradientArray.length;
        const numberOfClassifications = gradientLength - Math.ceil(gradientLength*0.4);
        return series.getClassJenks(numberOfClassifications);
    }

    function closestValue(arrayOfValues, value) {
        //it makes sure that nothing above zero is assigned to the zero bin.
        if (value === 0) {
            return 0;
        }
        let currentValue = arrayOfValues[0];
        let currIndex = 1;
        for (let i = 1; i < arrayOfValues.length; i++) {
            if (Math.abs(value - arrayOfValues[i]) < Math.abs(value - currentValue)) {
                currentValue = arrayOfValues[i];
                currIndex = i;
            }
        }
        return currIndex;
    }

    function rescaleHeatmapValue(value, minMaxValue){
        if (value === null){
            return 0;
        }

        if (value === -1){
            return -1;
        }

        if (value === 0){
            return 0;
        }

        if ((minMaxValue[1] - minMaxValue[0]) === 0){
            return 0;
        }
        const scaledValue = (value - minMaxValue[0]) / (minMaxValue[1] - minMaxValue[0]);
        return scaledValue;
    }

}
