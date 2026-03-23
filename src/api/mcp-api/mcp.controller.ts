import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServerService } from './mcp-server.service';
import { McpAuthService } from './mcp-auth.service';
import { coerceJsonRpcBody } from './coerce-stringified-args';

@ApiExcludeController()
@Controller('mcp')
export class McpController {
  constructor(
    private readonly mcpServer: McpServerService,
    private readonly mcpAuth: McpAuthService,
  ) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response) {
    try {
      const userContext = await this.mcpAuth.extractUserContext(req);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      const server = new McpServer({
        name: 'template-nestjs-api',
        version: '0.1.0',
      });

      this.mcpServer.registerTools(server, userContext);

      await server.connect(transport);
      await transport.handleRequest(req, res, coerceJsonRpcBody(req.body));
    } catch (error) {
      if (res.headersSent) return;

      if (error instanceof UnauthorizedException) {
        const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:8080';
        res.setHeader(
          'WWW-Authenticate',
          `Bearer resource_metadata="${publicUrl}/.well-known/oauth-protected-resource", scope="mcp"`,
        );
        res.status(HttpStatus.UNAUTHORIZED).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: error.message },
          id: null,
        });
        return;
      }

      if (error instanceof ForbiddenException) {
        res.status(HttpStatus.FORBIDDEN).json({
          jsonrpc: '2.0',
          error: { code: -32003, message: error.message },
          id: null,
        });
        return;
      }

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        id: null,
      });
    }
  }

  @Get()
  handleGet(@Res() res: Response) {
    res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'SSE transport not supported. Use POST.' },
      id: null,
    });
  }

  @Delete()
  handleDelete(@Res() res: Response) {
    res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Session management not supported.' },
      id: null,
    });
  }
}
