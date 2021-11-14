import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.util.Arrays;
import java.util.Date;


public class BilibiliHttpClass {

    public static void main(String[] args) throws IOException {
        BilibiliHttpClass.handleHTTP();
    }

    static class MyHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            System.out.println("HTTP server in handle function, " + new Date());
            String reqMethod = t.getRequestMethod();
            URI reqURI = t.getRequestURI();
            String reqURIStr = reqURI.toString();
            InputStream reqBody = t.getRequestBody();
            OutputStream os = t.getResponseBody();
            Headers reqHeaders = t.getRequestHeaders();
            String response;

            if (reqURIStr.equals("/")) {
                response =
                        reqMethod + "\r\n\r\n" +
                                reqURI + "\r\n\r\n" +
                                reqHeaders.getClass() + "\r\n\r\n" +
                                reqHeaders.entrySet() + "\r\n\r\n" +
                                reqHeaders.keySet() + "\r\n\r\n" +
                                reqHeaders.values() + "\r\n\r\n" +
                                t.getResponseHeaders().keySet() + "\r\n\r\n" +
                                t.getResponseBody().toString() + "\r\n\r\n" +
                                Arrays.toString(reqBody.readAllBytes());

                t.sendResponseHeaders(200, response.length());
                os.write(response.getBytes());
            } else if (reqURIStr.equals("/favicon.ico")) {
                response = "ok";
                t.sendResponseHeaders(404, response.length());
                os.write(response.getBytes());
            } else {
                response = "not found";
                t.sendResponseHeaders(404, -1);
                os.write(response.getBytes());
            }
            os.close();

        }
    }

    public static void handleHTTP () throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/", new MyHandler());
        server.setExecutor(null); // creates a default executor
        server.start();
    }
}
