const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");

// Jaeger Exporter
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");

// Instrumentations
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");

// Exporter and Provider Setup
module.exports = (serviceName) => {
    // Configure Jaeger Exporter
    const exporter = new JaegerExporter({
        endpoint: "http://localhost:14268/api/traces",
    });

    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
    });

    // Add the Jaeger Exporter to the provider
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();

    // Configure HttpInstrumentation with request and response hooks
    const httpInstrumentation = new HttpInstrumentation({
        requestHook: (span, requestInfo) => {
            console.log("HTTP Request Captured:", requestInfo);
        },
        responseHook: (span, responseInfo) => {
            console.log("HTTP Response Captured:", responseInfo);
        },
    });

    // Configure ExpressInstrumentation to not suppress HTTP instrumentation
    const expressInstrumentation = new ExpressInstrumentation({
        suppressHttpServerInstrumentation: false, // Enable HTTP server instrumentation
    });

    // Register instrumentations
    registerInstrumentations({
        instrumentations: [
            httpInstrumentation,
            expressInstrumentation,
            new MongoDBInstrumentation(),
        ],
        tracerProvider: provider,
    });

    console.log("Tracing initialized for:", serviceName);
    return trace.getTracer(serviceName);
};
