const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Configuración de MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'Twitter'; // Según el PDF (Paso 1 y 2)
const collectionName = 'tweets';

const client = new MongoClient(url);

async function main() {
    try {
        // Conectar a Mongo
        await client.connect();
        console.log('Conectado exitosamente a MongoDB');
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // ==========================================
        // RUTAS DE LA API (Preguntas P1 - P5)
        // ==========================================

        // P1: Tweets que mencionan a "Daniel Urresti"
        // Ruta: http://localhost:3000/api/urresti
        app.get('/api/urresti', async (req, res) => {
            try {
                // Query 1 provista por ti
                const result = await collection.find({ text: { $regex: "Daniel Urresti", $options: "i" } }).toArray();
                res.json({ total: result.length, data: result });
            } catch (e) { res.status(500).send(e.toString()); }
        });

        // P2: Fecha y texto de los 5 últimos tweets
        // Ruta: http://localhost:3000/api/ultimos
        app.get('/api/ultimos', async (req, res) => {
            try {
                // Query 2 provista por ti (proyección y ordenamiento)
                const result = await collection.find(
                    {},
                    { projection: { date: 1, text: 1 } } // projection reemplaza al 2do argumento en driver Node
                ).sort({ date: -1 }).limit(5).toArray();
                
                res.json(result);
            } catch (e) { res.status(500).send(e.toString()); }
        });

        // P3: Cantidad de Tweets y Retweets
        // Ruta: http://localhost:3000/api/stats
        app.get('/api/stats', async (req, res) => {
            try {
                // Query 3 provista por ti (Aggregation)
                const pipeline = [
                    {
                        $group: {
                            _id: "$retweeted", // true es retweet, false es tweet original
                            total: { $sum: 1 }
                        }
                    }
                ];
                const result = await collection.aggregate(pipeline).toArray();
                res.json(result);
            } catch (e) { res.status(500).send(e.toString()); }
        });

        // P4: Cantidad de menciones a Renzo Reggiardo
        // Ruta: http://localhost:3000/api/reggiardo
        app.get('/api/reggiardo', async (req, res) => {
            try {
                // Query 4 Generada
                const count = await collection.countDocuments({ text: { $regex: "Renzo Reggiardo", $options: "i" } });
                res.json({ candidato: "Renzo Reggiardo", menciones: count });
            } catch (e) { res.status(500).send(e.toString()); }
        });

        // P5: Comparación de candidatos (Menor cantidad de menciones)
        // Ruta: http://localhost:3000/api/comparacion
        app.get('/api/comparacion', async (req, res) => {
            try {
                // Ejecutamos las 5 queries provistas en paralelo
                const [urresti, reggiardo, belmont, munoz, castaneda] = await Promise.all([
                    collection.countDocuments({ text: /Urresti/i }),
                    collection.countDocuments({ text: /Reggiardo/i }),
                    collection.countDocuments({ text: /Belmont/i }),
                    collection.countDocuments({ text: /(Muñoz|Munoz)/i }),
                    collection.countDocuments({ text: /(Castañeda|Castaneda)/i })
                ]);

                const resultados = [
                    { candidato: "Urresti", total: urresti },
                    { candidato: "Reggiardo", total: reggiardo },
                    { candidato: "Belmont", total: belmont },
                    { candidato: "Muñoz", total: munoz },
                    { candidato: "Castañeda", total: castaneda }
                ];

                // Ordenar para encontrar el menor
                resultados.sort((a, b) => a.total - b.total);

                res.json({
                    ganador_menos_menciones: resultados[0],
                    ranking_completo: resultados
                });
            } catch (e) { res.status(500).send(e.toString()); }
        });

        // Iniciar el servidor
        app.listen(port, () => {
            console.log(`Servidor API corriendo en http://localhost:${port}`);
            console.log(`Prueba P1: http://localhost:${port}/api/urresti`);
            console.log(`Prueba P2: http://localhost:${port}/api/ultimos`);
            console.log(`Prueba P3: http://localhost:${port}/api/stats`);
            console.log(`Prueba P4: http://localhost:${port}/api/reggiardo`);
            console.log(`Prueba P5: http://localhost:${port}/api/comparacion`);
        });

    } catch (err) {
        console.error("Error conectando a Mongo:", err);
    }
}

main();
