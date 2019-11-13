<?php
namespace Responses;

require 'Payload.php';
require 'RegValueFormatter.php';

use Peridot\ObjectPath\ObjectPath;
use Responses\Formatter\ValueFormatter;

function starts_with($haystack, $needle)
{
     $length = strlen($needle);
     return (substr($haystack, 0, $length) === $needle);
}

class RegPayload extends Payload
{
    public function validate(): bool {
        $schema = $this->config->dataSchema;

        $this->setSchema($schema);

        return parent::validate($schema);
    }

    public function toCSVArray(): array {
        // TODO: use the json-to-csv.json file to convert this to a CSV string
        $config = $this->json_parser->parse(file_get_contents(__DIR__ . '/../../json-to-csv.json'));

        $formatter = new ValueFormatter($this);

        return array_map(function($field) use ($formatter) {
            if (starts_with($field[0], '$')) {
                $args = explode(":", $field[0]);
                $method = substr(array_shift($args), 1);

                if (method_exists($formatter, $method)) {
                    return $formatter->$method(...$args);
                }

                return "NOMETHOD $method(" . join(', ', $args) . ")";
            }

            return $formatter->get($field[0]);
        }, $config);
    }

    public function toCSV(): string {
        return json_encode($this->toCSVArray());
    }
}
