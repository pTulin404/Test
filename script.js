mapboxgl.accessToken = 'pk.eyJ1IjoiYm9zc3N3dSIsImEiOiJjbTMwMjQ3cTAwaWM2MmtzaDM5bmx2YWdjIn0.eF6WAV8P_hJFei-5bvXNbg';

if (mapboxgl.supported()) {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [102.83100340300001, 16.46700710999999],
        zoom: 16,
        pitch: 45,
    });

    const carbonChart = new Chart(document.getElementById("carbonChart").getContext("2d"), {
        type: 'pie',
        data: {
            labels: ['Carbon Emission', 'Carbon Absorption'],
            datasets: [{
                data: [31827.27018, 930.9828067],
                backgroundColor: ['#f91021', '#23eb15']
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });

    function updateChart(emission, absorption) {
        carbonChart.data.datasets[0].data = [emission, absorption];
        carbonChart.update();
    }

    function loadCurrentData() {
        map.getSource('buildings').setData('finalBL.geojson');
        map.getSource('carbonAbsorption').setData('filtered_converted_finalTree.geojson');

        document.getElementById("carbonEmission").innerText = "31827.27018 tCO2e";
        document.getElementById("carbonAbsorption").innerText = "930.9828067 tCO2e";

        updateChart(31827.27018, 930.9828067);

        map.setPaintProperty('carbon-absorption-area', 'fill-color', [
            'case',
            ['<=', ['get', 'tco2e'], 15], '#1E90FF',   // สีน้ำเงิน
            ['<=', ['get', 'tco2e'], 40], '#8A2BE2',   // สีม่วง
            '#FF8C00'                                  // สีส้ม
        ]);
    }

    function loadFutureData() {
        map.getSource('buildings').setData('converted_BL30.geojson');
        map.getSource('carbonAbsorption').setData('converted_polytree30.geojson');

        document.getElementById("carbonEmission").innerText = "31252.76018 tCO2e";
        document.getElementById("carbonAbsorption").innerText = "15081.92147 tCO2e";

        updateChart(31252.76018, 15081.92147);

        map.setPaintProperty('carbon-absorption-area', 'fill-color', [
            'case',
            ['<=', ['get', 'tco2e'], 300], '#1E90FF',   // สีน้ำเงิน
            ['<=', ['get', 'tco2e'], 600], '#8A2BE2',   // สีม่วง
            '#FF8C00'                                  // สีส้ม
        ]);
    }

    map.on('load', () => {
        map.addSource('buildings', {
            type: 'geojson',
            data: 'finalBL.geojson',
        });

        map.addSource('carbonAbsorption', {
            type: 'geojson',
            data: 'filtered_converted_finalTree.geojson'
        });

        map.addLayer({
            id: '3d-buildings',
            source: 'buildings',
            type: 'fill-extrusion',
            paint: {
                'fill-extrusion-color': [
                    'case',
                    ['<=', ['get', 'tco2e'], 0.5], '#00FF00',
                    ['<=', ['get', 'tco2e'], 1.0], '#FFFF00',
                    '#FF0000'
                ],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9,
            },
        });

        map.addLayer({
            id: 'carbon-absorption-area',
            source: 'carbonAbsorption',
            type: 'fill',
            paint: {
                'fill-color': [
                    'case',
                    ['<=', ['get', 'tco2e'], 15], '#1E90FF',   // สีน้ำเงิน
                    ['<=', ['get', 'tco2e'], 40], '#8A2BE2',   // สีม่วงเข้ม
                    '#FF8C00'                                  // สีส้ม
                ],
                'fill-opacity': 0.6,
            },
        });

        map.on('click', '3d-buildings', (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                const coordinates = feature.geometry.coordinates[0][0].slice();
                const buildingName = feature.properties.BL_NAME || 'ข้อมูลไม่มีชื่อ';
                const buildingType = feature.properties.BL_Type || 'ข้อมูลไม่มีประเภท';
                const height = feature.properties.height || 'ข้อมูลไม่มีความสูง';
                const tco2e = feature.properties.tco2e || 'ข้อมูลไม่มีค่าคาร์บอน';

                const description = `
                    <strong>Building Name:</strong> ${buildingName}<br>
                    <strong>Building Type:</strong> ${buildingType}<br>
                    <strong>Height:</strong> ${height} เมตร<br>
                    <strong>Carbon Emission (tCO2e):</strong> ${tco2e}
                `;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            } else {
                console.error("No features found at the clicked location");
            }
        });

        map.on('click', 'carbon-absorption-area', (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                const coordinates = e.lngLat;
                const tco2e = feature.properties.tco2e || 'ข้อมูลไม่มีค่าคาร์บอนที่ดูดซับได้';

                const description = `
                    <strong>Carbon Absorption Area</strong><br>
                    <strong>Absorbed Carbon (tCO2e):</strong> ${tco2e}
                `;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            } else {
                console.error("No features found at the clicked location");
            }
        });

        map.on('mouseenter', '3d-buildings', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', '3d-buildings', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'carbon-absorption-area', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'carbon-absorption-area', () => {
            map.getCanvas().style.cursor = '';
        });
    });
} else {
    alert('Your browser does not support WebGL.');
}
