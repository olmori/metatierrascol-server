import { HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { DataService } from "../../services/data.service";

export function httpAuthTokenInterceptor(req: HttpRequest<unknown>) {
    // Inject the current `AuthService` and use it to get an authentication token:
    const authToken = inject(DataService).authToken;
    // Clone the request to add the authentication header.
    const newReq = req.clone();
    newReq.headers.append('X-Authentication-Token', authToken);
    return newReq;
}