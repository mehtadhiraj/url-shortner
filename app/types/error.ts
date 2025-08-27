import { IsNumber, IsString } from "class-validator";

export interface ErrorCodeType {
    code: string;
    message: string;
    exception: any;
    status: number;
}

export class CustomError extends Error {
    @IsString()
    public code: string;

    @IsString()
    public exception: any;

    @IsString()
    public message: string;

    @IsString()
    public stackTrace: string;

    @IsNumber()
    public status: number;

    errors: Error[];

    constructor(error: Error, { code, message, exception, status }: ErrorCodeType, customMessage?: string) {
        super(typeof error === 'string' ? error : error.message);
        this.code = code;
        this.exception = exception;
        this.message = customMessage || message || 'Oops, something went wrong!';
        this.stackTrace = typeof error === 'string' ? this.stack : error.stack || this.stack;
        this.status = status || 500;
    }

    public getObject() {
        return {
            code: this.code,
            exception: this.exception,
            message: this.message,
            stackTrace: this.stackTrace,
            status: this.status,
        };
    }
}
