import { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { BadRequestError } from "./errors/bad-request-error";
import { UnauthorizedError } from "./errors/unauthorized";

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if ((error as FastifyError).code === 'FST_ERR_VALIDATION') {
    const validationErros: Record<string, string[]> = {}

    for (const issue of (error as any).validation) {
      const fieldName = issue.instancePath.substring(1)

      if (!validationErros[fieldName]) {
        validationErros[fieldName] = []
      }

      validationErros[fieldName].push(issue.message)
    }

    return reply.status(400).send({
      message: 'Validation Error',
      errors: validationErros
    })
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation Error',
      errors: error.flatten().fieldErrors
    })
  }

  if (error instanceof BadRequestError) {
    reply.status(400).send({
      message: error.message
    })
  }

  if (error instanceof UnauthorizedError) {
    reply.status(401).send({
      message: error.message,
    })
  }

  console.error(error)

  reply.status(500).send({ message: 'Internal server error' })
}