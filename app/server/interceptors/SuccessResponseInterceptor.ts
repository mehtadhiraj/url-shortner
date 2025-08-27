import { Interceptor, InterceptorInterface, Action, Middleware } from 'routing-controllers';
import { Service } from 'typedi';
import Responder from '../Responder/Responder';

@Interceptor()
@Service()
export class SuccessResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: any) {
    return Responder.sendSuccess(action.response, content, action.response.statusCode);
  }
}