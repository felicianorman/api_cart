const path = require('path')
const fsPromises = require('fs/promises')
const { fileExists, readJsonFile } = require('../utils/fileHandling')
const { GraphQLError } = require('graphql')
const crypto = require('node:crypto') //Inbyggt paket crypto
const { ticketType, ticketPriority, ticketStatus } = require('../enums/tickets')
const axios = require('axios').default

exports.resolvers = {
	Query: {
		getProjectById: async (_, args) => {
			const projectId = args.projectId
			// `../data/projects/${projectId}.json`
			const projectFilePath = path.join(__dirname, `../data/projects/${projectId}.json`)

			const projectExists = await fileExists(projectFilePath)
			if (!projectExists) return new GraphQLError('That project does not exist')

			const projectData = await fsPromises.readFile(projectFilePath, { encoding: 'utf-8' })
			const data = JSON.parse(projectData)
			return data
		},
		getAllProjects: async (_, args) => {
			const projectsDirectory = path.join(__dirname, '../data/projects')

			const projects = await fsPromises.readdir(projectsDirectory)

			const promises = []
			projects.forEach((fileName) => {
				const filePath = path.join(projectsDirectory, fileName)
				promises.push(readJsonFile(filePath))
			})

			const projectData = await Promise.all(promises)
			return projectData
		},
	},
	Mutation: {
		createProject: async (_, args) => {
			//Veriiera namn
			if (args.name.lenght === 0) return new GraphQLError('Name must be at least 1 charachter long')

			//Skapa ett unikt ID + data objektet
			const newProject = {
				id: crypto.randomUUID(),
				name: args.name,
				description: args.description || ' ',
			}

			let filePath = path.join(__dirname, './../data/projects', `${newProject.id}.json`)

			let idExists = true
			while (idExists) {
				const exists = await fileExists(filePath)
				console.log(exists, newProject.id)
				idExists = exists

				if (exists) {
					newProject.id = crypto.randomUUID()
					filePath = path.join(__dirname, `../data/projects/${newProject.id}.json`)
				}
				idExists = exists
			}

			//Skapa en fil för projektet i /data/projects

			//Behöver inte lagra i variabel. Om det blir success kommer det stå undefined/annars slänger den ut en error.
			await fsPromises.writeFile(filePath, JSON.stringify(newProject))

			//Skapa vår respons
			return newProject
		},
		updateProject: async (_, args) => {
			//Hämtar alla parametrar
			const { id, name, description } = args

			// Skapa våran filePath
			let filePath = path.join(__dirname, './../data/projects', `${id}.json`)

			//Kollar om filen finns som vi vill ändra. Finns den inte blir det error
			const projectExists = await fileExists(filePath)
			if (!projectExists) return new GraphQLError('That project does not exist')

			// Skapa updatedProject objekt
			const updatedProject = {
				id,
				name,
				description,
			}

			//Skriv över den gamla filen med nya infon
			await fsPromises.writeFile(filePath, JSON.stringify(updatedProject))

			//return updatedProject
			return updatedProject
		},
		deleteProject: async (_, args) => {
			//get project id
			const projectId = args.projectId

			//filepath
			// Skapa våran filePath
			let filePath = path.join(__dirname, './../data/projects', `${projectId}.json`)

			//does this project exist
			//if no (return error)
			const projectExists = await fileExists(filePath)
			if (!projectExists) return new GraphQLError('That project does not exist')

			//delete file
			await fsPromises.unlink(filePath)

			//return
			return {
				deletedId: projectId,
				success: true,
			}
		},
		createTicket: async (_, args) => {
			console.log(require('dotenv').config())
			console.log(process.env.SHEETDB_URI)

			//Destructure input variables
			const { title, description, type, priority, projectId } = args.input

			//Skapa filePath till projektet
			const filePath = path.join(__dirname, `../data/projects/${projectId}`)

			//Finns projektet som de vill skapa en ticket för?
			//If (no) return error

			const projectExists = await fileExists(filePath)
			if (!projectExists) return new GraphQLError('That project does not exist')

			//Skapa ett JS objekt som motsvarar hur vi vill att datan
			//ska läggas in i vårt sheet
			//generate random ID för våran ticket
			const newTicket = {
				id: crypto.randomUUID(),
				title,
				description: description || '',
				type,
				priority: priority || ticketPriority.LOW,
				status: ticketStatus.NEW,
				projectId,
			}

			//post request till sheetDB API:et = lägga till en rad för denna ticket i vår sheet
			try {
				require('dotenv').config();
				const endpoint = process.env.SHEETDB_URI
				const response = await axios.post(endpoint, {
					data: JSON.stringify(newTicket),
				}, {
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Accept-Encoding': 'gzip,deflate,compress'
					}
				})
				console.log(response);
			} catch (error) {
				console.log(error)
				return new GraphQLError('Could not create ticket')
			}

			//om vi lyckas returna JS objekt som motsvarar vår ticket type i schemat

			return {
				projectId: '123',
				title: 'Hej',
				description: 'Plupp',
				type: ticketType.BUG,
				priority: ticketPriority.LOW,
				status: ticketStatus.NEW,
			}
		},
	},
}
