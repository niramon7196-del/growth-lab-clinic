sed -i -e '/const server = http.createServer(app);/d' server.ts
sed -i -e '/server.listen(PORT, "0.0.0.0", () => {/d' server.ts
sed -i -e '/console.log(`\[Growth Lab Server\] Ready and listening/d' server.ts
sed -i -e '/  });/d' server.ts
