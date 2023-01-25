require('dotenv').config()
const { ApolloServer } = require('@apollo/server')
const { resolvers } = require('./resolvers')
const { loadFiles } = require('@graphql-tools/load-files')
const { makeExecutableSchema, extendResolversFromInterfaces } = require('@graphql-tools/schema')
const path = require('path')
// const { startStandaloneServer } = require('@apollo/server/standalone')

//importerar express paketet
const { expressMiddleware } = require('@apollo/server/express4')

//startar express
const express = require('express')

//express startar en serverapp som vi kan använda
const app = express()

//middleware
app.use(express.json())

//markerar att de innehåller statiska filer som ska skickas tillbaka
// när de kommer till en route som matchar
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'views')))

const port = process.env.PORT || 5000

async function run() {
	try {
		const typeDefs = await loadFiles(path.join(__dirname, 'schema.graphql'))
		const schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers })
		const server = new ApolloServer({ schema: schema })
		// const res = await startStandaloneServer(server)
		// console.log(`🚀 Server ready at ${res.url}`)

		await server.start()

		app.use('/graphql', expressMiddleware(server))

		//lyssna på port 5000. (localhost:5000/)
		app.listen(port, () => {
			console.log(`🚀 Server ready at http://localhost:${port}/`)
		})
	} catch (error) {
		console.error(error)
	}
}

run()
